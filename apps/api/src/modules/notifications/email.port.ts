import { Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** İleti sınıfı (A17.5): işlemsel iletiye ticari içerik eklenmez. */
  category: 'transactional';
}

export const EMAIL_PORT = Symbol('EMAIL_PORT');

export interface EmailPort {
  send(message: EmailMessage): Promise<void>;
}

/** Yerel e-posta yakalayıcı (Mailpit HTTP API). Gerçek alıcıya hiçbir şey gitmez. */
export class MailpitEmailAdapter implements EmailPort {
  constructor(
    private readonly baseUrl: string,
    private readonly from: string,
  ) {}

  async send(m: EmailMessage): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        From: { Email: this.from, Name: 'İncelemeler' },
        To: [{ Email: m.to }],
        Subject: m.subject,
        Text: m.text,
        Tags: [m.category],
      }),
    });
    if (!res.ok) throw new Error(`Mailpit gönderimi başarısız: ${res.status}`);
  }
}

/** Test adaptörü: iletileri bellekte tutar. */
export class MemoryEmailAdapter implements EmailPort {
  readonly sent: EmailMessage[] = [];
  async send(m: EmailMessage): Promise<void> {
    this.sent.push(m);
  }
}

/** Sağlayıcı yapılandırılmadı (X-004): ileti gönderilmez, yalnızca içeriksiz uyarı loglanır. */
export class DisabledEmailAdapter implements EmailPort {
  private readonly logger = new Logger('Email');
  async send(m: EmailMessage): Promise<void> {
    this.logger.warn({ msg: 'email_disabled', category: m.category, subject: m.subject });
  }
}
