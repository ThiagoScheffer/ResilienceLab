import { ArchitectureNode, AwsServicePreset, ComponentType } from "../types/architecture";

export interface AwsServicePresetInfo {
  id: AwsServicePreset;
  service: string;
  shortName: string;
  category: string;
}

export const awsServicePresets: Record<AwsServicePreset, AwsServicePresetInfo> = {
  "amazon-cloudfront": { id: "amazon-cloudfront", service: "Amazon CloudFront", shortName: "CloudFront", category: "Edge" },
  "application-load-balancer": { id: "application-load-balancer", service: "Elastic Load Balancing", shortName: "Application Load Balancer", category: "Networking" },
  "amazon-ec2": { id: "amazon-ec2", service: "Amazon EC2", shortName: "EC2", category: "Compute" },
  "amazon-rds": { id: "amazon-rds", service: "Amazon RDS", shortName: "RDS PostgreSQL", category: "Database" },
  "amazon-elasticache": { id: "amazon-elasticache", service: "Amazon ElastiCache", shortName: "ElastiCache", category: "Database" },
  "amazon-sqs": { id: "amazon-sqs", service: "Amazon SQS", shortName: "SQS", category: "Messaging" },
  "amazon-s3": { id: "amazon-s3", service: "Amazon S3", shortName: "S3", category: "Storage" },
  "aws-backup": { id: "aws-backup", service: "AWS Backup", shortName: "Backup", category: "Resilience" },
  "amazon-cloudwatch": { id: "amazon-cloudwatch", service: "Amazon CloudWatch", shortName: "CloudWatch", category: "Observability" },
  users: { id: "users", service: "Customer traffic", shortName: "Customers", category: "Entry" }
};

const defaultByType: Record<ComponentType, AwsServicePreset> = {
  users: "users", "load-balancer": "application-load-balancer", "web-app": "amazon-ec2", database: "amazon-rds", cache: "amazon-elasticache", queue: "amazon-sqs", "object-storage": "amazon-s3", backup: "aws-backup", monitoring: "amazon-cloudwatch"
};

export const getAwsServicePreset = (node: ArchitectureNode) => awsServicePresets[node.configuration.awsServicePreset ?? defaultByType[node.type]];
export const getDefaultAwsPreset = (type: ComponentType) => defaultByType[type];
