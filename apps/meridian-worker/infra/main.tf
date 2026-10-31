terraform {
  required_version = ">= 1.5.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {}

variable "account_id" {
  description = "Cloudflare account id. Set CLOUDFLARE_ACCOUNT_ID and pass it as TF_VAR_account_id, or use scripts/up.sh."
  type        = string
}

variable "name_prefix" {
  description = "Prefix for the D1 database and the order queue. MERIDIAN_PREFIX overrides the default when a second desk is needed."
  type        = string
  default     = "meridian"
}

resource "cloudflare_d1_database" "replica" {
  account_id = var.account_id
  name       = "${var.name_prefix}-replica"
}

resource "cloudflare_queue" "orders" {
  account_id = var.account_id
  queue_name = "${var.name_prefix}-orders"
}

output "d1_database_id" {
  description = "D1 UUID written into the deploy Wrangler config."
  value       = cloudflare_d1_database.replica.id
}

output "d1_database_name" {
  value = cloudflare_d1_database.replica.name
}

output "queue_name" {
  value = cloudflare_queue.orders.queue_name
}

output "account_id" {
  value = var.account_id
}

output "name_prefix" {
  value = var.name_prefix
}
