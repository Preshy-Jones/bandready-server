export function baseEmail(content: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
      ${content}
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
      <p style="color: #64748B; font-size: 14px; text-align: center;">
        Need help? Contact us at <a href="mailto:support@bandready.app" style="color: #2E3192;">support@bandready.app</a>
      </p>
      <p style="color: #64748B; font-size: 12px; text-align: center;">Team BandReady</p>
    </div>
  `;
}

export function ctaButton(href: string, label: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${href}" style="background-color: #2E3192; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
        ${label}
      </a>
    </div>
  `;
}

export function infoBox(text: string): string {
  return `
    <div style="background-color: #F1F5F9; border-left: 4px solid #2E3192; padding: 15px; margin: 25px 0;">
      <p style="margin: 0; color: #1E293B; font-weight: 500;">${text}</p>
    </div>
  `;
}

/** Converts plain-text paragraphs (double-newline separated) into HTML <p> tags. */
export function textToParagraphs(text: string): string {
  return text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p) => `<p style="color: #1E293B; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}
