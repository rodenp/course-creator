import { stripeWebhookService } from './stripe-webhooks';

class WebhookPollingService {
  private pollingInterval: number | null = null;
  private isPolling = false;

  // Start polling for webhook events
  startPolling(intervalMs = 5000) {
    if (this.isPolling) {
      console.log('📡 Webhook polling already active');
      return;
    }

    console.log('🔄 Starting webhook polling every', intervalMs, 'ms');
    this.isPolling = true;

    this.pollingInterval = window.setInterval(async () => {
      try {
        await this.pollForEvents();
      } catch (error) {
        console.error('❌ Webhook polling error:', error);
      }
    }, intervalMs);

    // Poll immediately on start
    this.pollForEvents();
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('⏹️ Webhook polling stopped');
    }
  }

  // Check for new webhook events
  private async pollForEvents() {
    try {
      const response = await fetch('/api/webhooks/stripe-production', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.events && data.events.length > 0) {
        console.log(`📡 Received ${data.count} webhook events from server`);

        // Process each event through our webhook service
        for (const event of data.events) {
          console.log('🎣 Processing webhook event:', event.type, event.id);
          await stripeWebhookService.handleEvent(event);
        }
      }
    } catch (error) {
      console.error('❌ Failed to poll webhook events:', error);
    }
  }

  // Check if polling is active
  isActive() {
    return this.isPolling;
  }
}

// Export singleton instance
export const webhookPollingService = new WebhookPollingService();

// Auto-start polling when the service is imported (only in browser)
if (typeof window !== 'undefined') {
  // Start polling after a short delay to ensure the app is ready
  setTimeout(() => {
    webhookPollingService.startPolling(3000); // Poll every 3 seconds
  }, 1000);

  // Stop polling when the page is about to unload
  window.addEventListener('beforeunload', () => {
    webhookPollingService.stopPolling();
  });
}
