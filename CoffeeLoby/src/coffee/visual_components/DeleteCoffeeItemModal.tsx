import React, {useState} from "react";
import {createAnimation, IonButton, IonModal, IonContent} from "@ionic/react";

interface IDeleteCoffeeItemModal {
    onConfirmDelete: () => void,
    onClose: () => void,
    showModal: boolean
}

export const DeleteCoffeeItemModal: React.FC<IDeleteCoffeeItemModal> = ({onConfirmDelete, onClose, showModal}) => {

    const enterAnimation = (baseEl: any) => {
        const backdropAnimation = createAnimation()
            .addElement(baseEl.querySelector('ion-backdrop')!)
            .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

        const wrapperAnimation = createAnimation()
            .addElement(baseEl.querySelector('.modal-wrapper')!)
            .keyframes([
                { offset: 0, opacity: '0', transform: 'scale(0)' },
                { offset: 1, opacity: '0.99', transform: 'scale(1)' }
            ]);

        return createAnimation()
            .addElement(baseEl)
            .easing('ease-out')
            .duration(500)
            .addAnimation([backdropAnimation, wrapperAnimation]);
    }

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction('reverse');
    }

    return (
        <IonModal isOpen={showModal} enterAnimation={enterAnimation} leaveAnimation={leaveAnimation}>
            <p>Are you sure you want to delete this coffee?</p>
            <span>
                <IonButton onClick={() => onClose()}>Cancel</IonButton>
            </span>
            <span>
                <IonButton onClick={() => { onConfirmDelete(); onClose(); }}>Confirm</IonButton>
            </span>
        </IonModal>
    );
};