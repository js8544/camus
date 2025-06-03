import { registerOTel } from '@vercel/otel'
import { AISDKExporter } from 'langsmith/vercel'

export function register() {
  registerOTel({
    serviceName: 'camus-ai-sdk',
    traceExporter: new AISDKExporter(),
  })
} 
