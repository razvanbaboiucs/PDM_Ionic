import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { CoffeeItemProps } from "../data/CoffeeItemProps";

interface CoffeeItemPropsExt extends CoffeeItemProps {
    onEdit: (id?: string | undefined) => void;
}

const CoffeeItem: React.FC<CoffeeItemPropsExt> = ({ _id, title, description, date, recommended, mark, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(_id)}>
            <IonLabel>{title}</IonLabel>
            <IonLabel>{mark}</IonLabel>
            <IonLabel className={'date-column'}>{date}</IonLabel>
            <IonLabel className={'mark-column'}>{recommended ? 'yes' : "no"}</IonLabel>
        </IonItem>
    );
};

export default CoffeeItem;