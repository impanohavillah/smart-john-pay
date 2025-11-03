import { SmsManager } from '@byteowls/capacitor-sms';
import { Capacitor } from '@capacitor/core';

export interface SendSMSOptions {
  phoneNumber: string;
  message: string;
}

export const useNativeSMS = () => {
  const isNative = Capacitor.isNativePlatform();

  const sendSMS = async ({ phoneNumber, message }: SendSMSOptions): Promise<boolean> => {
    if (!isNative) {
      throw new Error('SMS sending is only available on native mobile platforms');
    }

    try {
      await SmsManager.send({
        numbers: [phoneNumber],
        text: message
      });
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  };

  const checkSMSPermission = async (): Promise<boolean> => {
    if (!isNative) {
      return false;
    }
    // SMS permissions are requested automatically when sending
    return true;
  };

  return {
    sendSMS,
    checkSMSPermission,
    isNative
  };
};
