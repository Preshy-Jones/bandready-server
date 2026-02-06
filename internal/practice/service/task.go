package practiceservice

import (
	"encoding/json"

	"github.com/hibiken/asynq"
)

const TypeAudioProcessing = "audio:process"

type AudioJobPayload struct {
	SessionID    string `json:"sessionId"`
	UserID       string `json:"userId"`
	AudioData    []byte `json:"audioData"`
	PrepTime     *int   `json:"prepTime,omitempty"`
	SpeakingTime *int   `json:"speakingTime,omitempty"`
}

func NewAudioProcessingTask(payload AudioJobPayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeAudioProcessing, data), nil
}
