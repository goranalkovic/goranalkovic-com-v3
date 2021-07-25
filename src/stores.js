import {get, readable } from "svelte/store";
import { writable } from 'svelte-local-storage-store'

export const reducedMotion = readable(false, (set) => {
    const query = "(prefers-reduced-motion: no-preference)";
    const mediaQueryList = typeof window !== "undefined" ? window.matchMedia(query) : {};

    const onChange = () => set(!mediaQueryList.matches);

    if (typeof window !== "undefined") {
        mediaQueryList.addListener(onChange);
        onChange();
    }

    return () => {
        if (typeof window !== "undefined") mediaQueryList.removeListener(onChange);
    }
});

export const prefersColorSchemeDark = readable(false, (set) => {
    const query = "(prefers-color-scheme: light)";
    const mediaQueryList = typeof window !== "undefined" ? window.matchMedia(query) : {};

    const onChange = () => set(!mediaQueryList.matches);

    if (typeof window !== "undefined") {
        mediaQueryList.addListener(onChange);
        onChange();
    }

    return () => {
        if (typeof window !== "undefined") mediaQueryList.removeListener(onChange);
    }
});

export const ThemeMode = {
    AUTO: 'auto',
    LIGHT: 'light',
    DARK: 'dark'
}

export const preferences = writable('preferences', {
    theme: ThemeMode.AUTO,
});