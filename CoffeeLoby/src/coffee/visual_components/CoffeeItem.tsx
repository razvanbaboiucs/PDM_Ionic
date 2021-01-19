import React from 'react';
import {
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonImg, createAnimation
} from '@ionic/react';
import { CoffeeItemProps } from "../data/CoffeeItemProps";
import {heart, remove} from "ionicons/icons";

interface CoffeeItemPropsExt extends CoffeeItemProps {
    onEdit: (id?: string | undefined) => void;
}

const CoffeeItem: React.FC<CoffeeItemPropsExt> = ({ _id, title, description, date, recommended, mark, photo, onEdit }) => {


    return (
        <IonCard onClick={() => onEdit(_id)}>
            <IonCardHeader>
                <div className={'title'}>
                    <IonCardTitle>
                        {title}
                    </IonCardTitle>
                </div>
                <div className={'mark'}>
                    <IonCardSubtitle>
                        {mark}
                    </IonCardSubtitle>
                </div>
            </IonCardHeader>
            <IonCardContent>
                <IonImg src={photo?.webviewPath}/>
                <IonIcon icon={recommended ? heart : remove} />
            </IonCardContent>
        </IonCard>
    );
}

export default CoffeeItem;