/** Canal de notificación (Email / SMS / WebPush) con la suscripción del usuario. */
export interface NotificationChannelPref {
  chanelId: number
  chanelName: string
  chanelDescription: string
  status: boolean
}

/** Tipo de notificación del catálogo con la preferencia del usuario (sin fila = apagado). */
export interface NotificationTypePref {
  typeId: number
  preferenceType: string
  preferenceDescription: string
  status: boolean
}

export interface NotificationInfo {
  userSuscriptions: NotificationChannelPref[]
  usersPreferences: NotificationTypePref[]
}

/** Payload del PUT: solo ids y estado (token únicamente al suscribir WebPush). */
export interface NotificationInfoUpdate {
  userSuscriptions: { chanelId: number; status: boolean; token?: string }[]
  usersPreferences: { typeId: number; status: boolean }[]
}
