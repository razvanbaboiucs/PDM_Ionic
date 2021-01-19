import {GeolocationPosition} from "@capacitor/core";

export interface CoffeeItemProps {
    _id?: string;
    description: string;
    date?: string;
    title: string;
    recommended?: boolean;
    mark?: number;
    acquiredAt?: number;
    photo?: Photo;
    position?: GeolocationPosition;
}

export interface Photo {
    filepath: string;
    webviewPath?: string;
}
