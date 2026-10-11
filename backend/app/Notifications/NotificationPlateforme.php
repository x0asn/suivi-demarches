<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification générique (M06) : enregistrée en base et, si le modèle le prévoit, envoyée par e-mail.
 */
class NotificationPlateforme extends Notification
{
    use Queueable;

    public function __construct(
        public string $evenement,
        public string $titre,
        public string $message,
        public ?string $lien = null,
        public array $contexte = [],
        public bool $parEmail = false,
    ) {}

    public function via(object $notifiable): array
    {
        return $this->parEmail ? ['database', 'mail'] : ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'evenement' => $this->evenement,
            'titre' => $this->titre,
            'message' => $this->message,
            'lien' => $this->lien,
            ...$this->contexte,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->titre.' — Suivi Démarches')
            ->greeting("Bonjour {$notifiable->prenom},")
            ->line($this->message);

        if ($this->lien) {
            $mail->action('Consulter sur Suivi Démarches', config('app.frontend_url').$this->lien);
        }

        return $mail->salutation('L’équipe Suivi Démarches');
    }
}
