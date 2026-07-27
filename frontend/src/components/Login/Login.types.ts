// Define explicit types for Eel responses and the global window object.

export interface EelLoginResponse {
    success: boolean;
    message?: string;
}

export interface EelApi {
    get_hwid_frontend: () => () => Promise<string>;
    attempt_login: () => () => Promise<EelLoginResponse>;
}

declare global {
    interface Window {
        eel?: EelApi;
    }
}

export interface LoginProps {
    onLoginSuccess: () => void;
}