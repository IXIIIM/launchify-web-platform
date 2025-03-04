# infrastructure/terraform/document-encryption.tf

# KMS key for document encryption
resource "aws_kms_key" "document_encryption" {
  description             = "KMS key for Launchify document encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Application Access"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.app_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:ReEncrypt*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Application = "Launchify"
    Purpose     = "Document Encryption"
  }
}

# KMS alias for easier reference
resource "aws_kms_alias" "document_encryption" {
  name          = "alias/launchify-document-encryption-${var.environment}"
  target_key_id = aws_kms_key.document_encryption.key_id
}

# S3 bucket for encrypted documents
resource "aws_s3_bucket" "documents" {
  bucket = "launchify-documents-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Application = "Launchify"
    Purpose     = "Encrypted Documents Storage"
  }
}

# S3 bucket for master keys
resource "aws_s3_bucket" "master_keys" {
  bucket = "launchify-master-keys-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Application = "Launchify"
    Purpose     = "Master Keys Storage"
  }
}

# Encryption configuration for documents bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.document_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Encryption configuration for master keys bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "master_keys" {
  bucket = aws_s3_bucket.master_keys.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.document_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block all public access to both buckets
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "master_keys" {
  bucket = aws_s3_bucket.master_keys.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning for both buckets
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "master_keys" {
  bucket = aws_s3_bucket.master_keys.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle rules for both buckets
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 60
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "master_keys" {
  bucket = aws_s3_bucket.master_keys.id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# IAM role for application
resource "aws_iam_role" "app_role" {
  name = "launchify-app-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for application access to KMS and S3
resource "aws_iam_role_policy" "app_policy" {
  name = "launchify-app-policy-${var.environment}"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:ReEncrypt*",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.document_encryption.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.documents.arn}/*",
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.master_keys.arn}/*",
          aws_s3_bucket.master_keys.arn
        ]
      }
    ]
  })
}

# Variables
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

# Outputs
output "kms_key_arn" {
  value = aws_kms_key.document_encryption.arn
}

output "documents_bucket_name" {
  value = aws_s3_bucket.documents.id
}

output "master_keys_bucket_name" {
  value = aws_s3_bucket.master_keys.id
}

output "app_role_arn" {
  value = aws_iam_role.app_role.arn
}