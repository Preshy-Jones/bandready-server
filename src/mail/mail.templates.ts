const BRAND_COLOR = '#4F46E5'; // Adjust to BandReady's exact primary color if needed (violet-600/primary)
const BRAND_HOVER = '#4338CA';
const TEXT_DARK = '#1E293B';
const TEXT_MUTED = '#64748B';

export function baseEmail(content: string): string {
  return `
    <div style="background-color: #F8FAFC; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
      <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <!-- Header -->
        <div style="padding: 32px 32px 0 32px; text-align: center;">
          <img src="https://bandready.app/logo.png" alt="BandReady Logo" style="height: 48px; width: 48px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);" />
          <h1 style="margin: 16px 0 0 0; color: ${TEXT_DARK}; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">BandReady</h1>
        </div>

        <!-- Content Structure -->
        <div style="padding: 32px;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="background-color: #F1F5F9; padding: 32px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="margin: 0 0 8px 0; color: ${TEXT_MUTED}; font-size: 14px;">
            Need help? Contact us at <a href="mailto:support@bandready.app" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: 500;">support@bandready.app</a>
          </p>
          <p style="margin: 0; color: #94A3B8; font-size: 12px;">© ${new Date().getFullYear()} BandReady. All rights reserved.</p>
        </div>

      </div>
      
      <!-- Hidden preheader text / Unsubscribe area if needed later -->
      <div style="max-width: 520px; margin: 0 auto; padding-top: 24px; text-align: center;">
        <p style="color: #94A3B8; font-size: 12px; margin: 0;">You're receiving this email because you signed up for BandReady.</p>
      </div>
    </div>
  `;
}

export function ctaButton(href: string, label: string): string {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${href}" style="background-color: ${BRAND_COLOR}; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -2px rgba(79, 70, 229, 0.2); border: 1px solid ${BRAND_HOVER};">
        ${label}
      </a>
    </div>
  `;
}

export function infoBox(text: string): string {
  return `
    <div style="background-color: #EEF2FF; border-left: 4px solid ${BRAND_COLOR}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; color: ${TEXT_DARK}; font-weight: 500; font-size: 15px; line-height: 1.5;">${text}</p>
    </div>
  `;
}

export function otpBlock(code: string): string {
  return `
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
      <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: ${BRAND_COLOR};">${code}</span>
    </div>
  `;
}

/** Converts plain-text paragraphs (double-newline separated) into HTML <p> tags. */
export function textToParagraphs(text: string): string {
  return text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p) => `<p style="color: #334155; line-height: 1.625; font-size: 16px; margin: 0 0 20px 0;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function emailH2(text: string): string {
  return `<h2 style="color: ${TEXT_DARK}; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">${text}</h2>`;
}

export function emailP(text: string): string {
  return `<p style="color: #334155; line-height: 1.625; font-size: 16px; margin: 0 0 20px 0;">${text}</p>`;
}

