declare module 'react-native-wa-stickers-animated' {
  interface StickerPackConfig {
    identifier: string;
    name: string;
    publisher: string;
    trayImageFileName: string;
    publisherEmail: string;
    publisherWebsite: string;
    privacyPolicyWebsite: string;
    licenseAgreementWebsite: string;
  }

  interface RNWhatsAppStickers {
    createStickerPack(config: StickerPackConfig): Promise<void>;
    addSticker(filename: string, emojis: string[]): Promise<void>;
    send(packId?: string, packName?: string): Promise<void>;
  }

  const RNWhatsAppStickers: RNWhatsAppStickers;
  export default RNWhatsAppStickers;
}
