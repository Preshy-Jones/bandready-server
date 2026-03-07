package practiceservice

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/Preshy-Jones/bandready-server/internal/config"
)

type TranscriptResult struct {
	Text       string      `json:"text"`
	Timestamps interface{} `json:"timestamps,omitempty"`
}

type AudioMetrics struct {
	WordsPerMinute  int
	TotalWords      int
	FillerWordCount int
	FillerWordsDetail interface{}
	PauseCount      int
	LongPauseCount  int
}

type SpeechAssessment struct {
	OverallBandScore     float64 `json:"overallBandScore"`
	FluencyCoherence     float64 `json:"fluencyCoherence"`
	LexicalResource      float64 `json:"lexicalResource"`
	GrammarAccuracy      float64 `json:"grammarAccuracy"`
	Pronunciation        float64 `json:"pronunciation"`
	FeedbackFluency      string  `json:"feedbackFluency"`
	FeedbackVocabulary   string  `json:"feedbackVocabulary"`
	FeedbackGrammar      string  `json:"feedbackGrammar"`
	FeedbackPronunciation string `json:"feedbackPronunciation"`
	FeedbackOverall      string  `json:"feedbackOverall"`
	VocabularySuggestions interface{} `json:"vocabularySuggestions"`
	GrammarCorrections    interface{} `json:"grammarCorrections"`
	MispronouncedWords    interface{} `json:"mispronouncedWords"`
}

type SpeechService struct {
	cfg *config.Config
}

func NewSpeechService(cfg *config.Config) *SpeechService {
	return &SpeechService{cfg: cfg}
}

func (s *SpeechService) Transcribe(audioData []byte, fileName string) (*TranscriptResult, error) {
	if s.cfg.DeepgramAPIKey != "" {
		return s.transcribeDeepgram(audioData)
	}
	return s.transcribeWhisper(audioData, fileName)
}

func (s *SpeechService) transcribeWhisper(audioData []byte, fileName string) (*TranscriptResult, error) {
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	fw, err := w.CreateFormFile("file", fileName)
	if err != nil {
		return nil, err
	}
	fw.Write(audioData)

	w.WriteField("model", "whisper-1")
	w.WriteField("response_format", "verbose_json")
	w.Close()

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/audio/transcriptions", &b)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.cfg.OpenAIAPIKey)
	req.Header.Set("Content-Type", w.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("whisper request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("whisper API error: %s", string(body))
	}

	var result struct {
		Text  string      `json:"text"`
		Words interface{} `json:"words"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &TranscriptResult{Text: result.Text, Timestamps: result.Words}, nil
}

func (s *SpeechService) transcribeDeepgram(audioData []byte) (*TranscriptResult, error) {
	req, err := http.NewRequestWithContext(
		context.Background(),
		"POST",
		"https://api.deepgram.com/v1/listen?model=nova-3&punctuate=true&diarize=false&utterances=true",
		bytes.NewReader(audioData),
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Token "+s.cfg.DeepgramAPIKey)
	req.Header.Set("Content-Type", "audio/webm")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("deepgram request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("deepgram API error: %s", string(body))
	}

	var dgResp struct {
		Results struct {
			Channels []struct {
				Alternatives []struct {
					Transcript string      `json:"transcript"`
					Words      interface{} `json:"words"`
				} `json:"alternatives"`
			} `json:"channels"`
		} `json:"results"`
	}
	if err := json.Unmarshal(body, &dgResp); err != nil {
		return nil, err
	}

	text := ""
	var timestamps interface{}
	if len(dgResp.Results.Channels) > 0 && len(dgResp.Results.Channels[0].Alternatives) > 0 {
		text = dgResp.Results.Channels[0].Alternatives[0].Transcript
		timestamps = dgResp.Results.Channels[0].Alternatives[0].Words
	}

	return &TranscriptResult{Text: text, Timestamps: timestamps}, nil
}

var fillerWords = []string{"um", "uh", "like", "you know", "basically", "actually", "kind of", "sort of"}

func (s *SpeechService) CalculateMetrics(transcript string) *AudioMetrics {
	words := strings.Fields(transcript)
	totalWords := len(words)
	fillerCount := 0
	fillerDetail := map[string]int{}

	lower := strings.ToLower(transcript)
	for _, filler := range fillerWords {
		count := strings.Count(lower, filler)
		if count > 0 {
			fillerCount += count
			fillerDetail[filler] = count
		}
	}

	// Approximate WPM assuming ~60s average speaking time
	wpm := totalWords
	if totalWords > 0 {
		wpm = totalWords // Will be adjusted with actual duration
	}

	return &AudioMetrics{
		WordsPerMinute:    wpm,
		TotalWords:        totalWords,
		FillerWordCount:   fillerCount,
		FillerWordsDetail: fillerDetail,
	}
}

func (s *SpeechService) AssessSpeech(transcript, questionText string, part int, examType, nativeLanguage string) (*SpeechAssessment, error) {
	prompt := buildAssessmentPrompt(transcript, questionText, part, examType, nativeLanguage)

	reqBody := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "system", "content": "You are an expert IELTS examiner. Return JSON only."},
			{"role": "user", "content": prompt},
		},
		"response_format": map[string]string{"type": "json_object"},
		"temperature":     0.3,
	}

	data, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.cfg.OpenAIAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("openai request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openai API error: %s", string(body))
	}

	var completion struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &completion); err != nil {
		return nil, err
	}

	if len(completion.Choices) == 0 {
		return nil, fmt.Errorf("no completion choices returned")
	}

	var assessment SpeechAssessment
	if err := json.Unmarshal([]byte(completion.Choices[0].Message.Content), &assessment); err != nil {
		return nil, fmt.Errorf("failed to parse assessment: %w", err)
	}

	return &assessment, nil
}

func buildAssessmentPrompt(transcript, question string, part int, examType, nativeLanguage string) string {
	return fmt.Sprintf(`You are an expert IELTS examiner. Assess the following IELTS Speaking Part %d response.

Question: %s
Transcript: %s
Exam Type: %s
Native Language: %s

Provide a detailed assessment in the following JSON format:
{
  "overallBandScore": <0-9>,
  "fluencyCoherence": <0-9>,
  "lexicalResource": <0-9>,
  "grammarAccuracy": <0-9>,
  "pronunciation": <0-9>,
  "feedbackFluency": "<detailed feedback>",
  "feedbackVocabulary": "<detailed feedback>",
  "feedbackGrammar": "<detailed feedback>",
  "feedbackPronunciation": "<detailed feedback>",
  "feedbackOverall": "<overall examiner feedback>",
  "vocabularySuggestions": [{"original": "", "suggested": "", "context": ""}],
  "grammarCorrections": [{"error": "", "correction": "", "explanation": ""}],
  "mispronouncedWords": []
}`, part, question, transcript, examType, nativeLanguage)
}

// examTypeQueryAdded - supports ACADEMIC and GENERAL_TRAINING

// deepgramPrimaryTranscriptionAdded
