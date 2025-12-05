import { useKoruAuth as sdkUseKoruAuth } from '@redclover/koru-react-sdk';

export const useKoruAuth = () => {
    if (import.meta.env.DEV) {
        // En desarrollo simulamos que la autenticación es exitosa (no hace nada)
        return;
    }
    return sdkUseKoruAuth();
};
