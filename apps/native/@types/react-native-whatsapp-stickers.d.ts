declare module 'react-native-whatsapp-stickers' {
  export interface Sticker {
    imageFileName: string
    emojis: string[]
  }

  interface RNWhatsAppStickers {
    add(
      packId: string,
      packName: string,
      publisher: string,
      trayImageFileName: string,
      publisherWebsite: string,
      privacyPolicyWebsite: string,
      licenseAgreementWebsite: string,
      isAnimated: boolean,
      stickers: Sticker[]
    ): Promise<void>

    addPack(
      packId: string,
      packName: string,
      publisher: string,
      trayImageFileName: string,
      publisherWebsite: string,
      privacyPolicyWebsite: string,
      licenseAgreementWebsite: string,
      isAnimated: boolean,
      stickers: Sticker[]
    ): Promise<void>
  }

  const RNWhatsAppStickers: RNWhatsAppStickers
  export default RNWhatsAppStickers
}
