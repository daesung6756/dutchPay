interface DutchPayWindow {
  getFormState?: () => any;
  resetForm?: () => void;
  showToast?: (msg: string, duration?: number) => void;
}

declare global {
  interface Window {
    dutchpay?: DutchPayWindow;
  }
}

export {};
