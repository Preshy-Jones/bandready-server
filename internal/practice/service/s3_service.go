package practiceservice

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/config"
	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Service struct {
	client *s3.Client
	bucket string
}

func NewS3Service(cfg *config.Config) *S3Service {
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if cfg.AWSS3Endpoint != "" {
			return aws.Endpoint{
				URL:           cfg.AWSS3Endpoint,
				SigningRegion: cfg.AWSRegion,
			}, nil
		}
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	})

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(cfg.AWSRegion),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AWSAccessKeyID,
			cfg.AWSSecretKey,
			"",
		)),
		awsconfig.WithEndpointResolverWithOptions(customResolver),
	)
	if err != nil {
		panic(fmt.Sprintf("failed to configure AWS: %v", err))
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		if cfg.AWSS3Endpoint != "" {
			o.UsePathStyle = true
		}
	})

	return &S3Service{client: client, bucket: cfg.AWSS3Bucket}
}

func (s *S3Service) UploadAudio(data []byte, userID, sessionID string) (string, error) {
	key := fmt.Sprintf("audio/%s/%s.webm", userID, sessionID)

	_, err := s.client.PutObject(context.Background(), &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String("audio/webm"),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload audio: %w", err)
	}

	return key, nil
}

func (s *S3Service) GetSignedURL(key string, expiresIn time.Duration) (string, error) {
	presigner := s3.NewPresignClient(s.client)

	result, err := presigner.PresignGetObject(context.Background(), &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expiresIn))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return result.URL, nil
}
