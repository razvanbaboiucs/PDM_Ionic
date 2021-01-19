import React, { useContext, useEffect, useState } from 'react';
import {
    IonCheckbox,
    IonLabel,
    IonImg,
    IonFab,
    IonIcon,
    IonFabButton,
    CreateAnimation,
    createAnimation
} from '@ionic/react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import { getLogger } from '../../core';
import { CoffeeItemContext } from '../data_providers/CoffeeItemProvider';
import { RouteComponentProps } from 'react-router';
import {CoffeeItemProps, Photo} from '../data/CoffeeItemProps';
import {useNetwork} from "../../core/useNetwork";
import {camera, cameraOutline, locate} from "ionicons/icons";
import {usePhotoGallery} from "../../core/usePhoto";
import { LocationMap } from './LocationMap';
import {Geolocation, GeolocationPosition} from "@capacitor/core";
import {DeleteCoffeeItemModal} from "./DeleteCoffeeItemModal";

const log = getLogger('ItemEdit');

interface ItemEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const CoffeeItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
    // initializations

    const { items, saving, savingError, saveItem, deleteItem, saveItemLocalStorage, deleteItemLocalStorage } = useContext(CoffeeItemContext);
    const [title, setTitle] = useState('');
    const [mark, setMark] = useState(0);
    const [description, setDescription] = useState('');
    const [recommended, setRecommended] = useState(true);
    const [photo, setPhoto] = useState<Photo>();
    const [item, setItem] = useState<CoffeeItemProps>();
    const [showModal, setShowModal] = useState(false);
    const [position, setPosition] = useState<GeolocationPosition>()
    const { networkStatus } = useNetwork();
    const { takePhoto } = usePhotoGallery();
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const item = items?.find(it => it._id === routeId);
        log(routeId);
        setItem(item);
        if (item) {
            setTitle(item.title);
            setMark(item.mark ? item.mark : 0);
            setRecommended(item.recommended ? item.recommended : false);
            setDescription(item.description);
            setPhoto(item.photo)
            setPosition(item.position)
        }
    }, [match.params.id, items]);
    const handleSave = () => {
        const editedItem = item ? { ...item, title, mark, description, recommended, date : new Date().toLocaleDateString(), photo, position } : { title, mark, description, recommended, date : new Date().toLocaleDateString(), photo, position};
        if (networkStatus.connected) {
            saveItem && saveItem(editedItem).then(() => history.goBack());
        }
        else {
            saveItemLocalStorage && saveItemLocalStorage(editedItem).then(() => history.goBack());
        }
    };
    const handleDelete = () => {
        const editedItem = item ? { ...item, title, mark, description, recommended, date : new Date().toLocaleDateString(), photo, position } : { title, mark, description, recommended, date : new Date().toLocaleDateString(), photo, position };
        if (networkStatus.connected) {
            deleteItem && deleteItem(editedItem).then(() => history.goBack());
        }
        else {
            deleteItemLocalStorage && deleteItemLocalStorage(editedItem).then(() => history.goBack());
        }
    };

    // animations

    const cameraElement = document.querySelector('.cameraFab');
    const positionElement = document.querySelector('.positionFab');
    if (cameraElement && positionElement) {
        const cameraFabAnimation = createAnimation()
            .addElement(cameraElement)
            .duration(2000)
            .fromTo('transform', 'translateX(300px)', 'translateX(0px)');
        const positionFabAnimation = createAnimation()
            .addElement(positionElement)
            .duration(2000)
            .fromTo('transform', 'translateX(-300px)', 'translateX(0px)');
        (async () => {
            await cameraFabAnimation.play();
            await positionFabAnimation.play();
        })();
    }


    // rendering

    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="end">
                        <CreateAnimation
                            duration={2000}
                            iterations={Infinity}
                            keyframes={
                                [
                                    { offset: 0, transform: 'scale(1)' },
                                    { offset: 0.5, transform: 'scale(1.5)' },
                                    { offset: 1, transform: 'scale(1)' }
                                ]
                            }
                        >
                            <IonButton onClick={handleSave}>
                                Save
                            </IonButton>
                        </CreateAnimation>
                        <IonButton onClick={() => setShowModal(true)}>
                            Delete
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')} placeholder={'Title'} />
                <IonInput value={description} onIonChange={e => setDescription(e.detail.value || '')} placeholder={'Description'} />
                <IonInput value={mark} onIonChange={e => setMark(parseInt(e.detail.value ? e.detail.value
                    : "5") || 5)} placeholder={'Mark'}/>
                <IonLabel>Recommended: </IonLabel>
                <IonCheckbox color = "light" checked = {recommended} onIonChange={e => setRecommended(e.detail.checked)} />
                <IonImg src={photo?.webviewPath}/>
                <LocationMap
                    lat={position ? (position.coords ? position.coords.latitude : 0.0) : 0.0}
                    lng={position ?  (position.coords ? position.coords.longitude : 0.0)  : 0.0}
                    onMapClick={(e: any) => {
                        console.log(e.latLng.lat(), e.latLng.lng())
                        setPosition({
                            coords: {
                                latitude: e.latLng.lat(),
                                longitude: e.latLng.lng(),
                                accuracy: e.latLng.accuracy,
                            },
                            timestamp: Date.now()
                        })
                    }}
                    onMarkerClick={log('onMarker')}
                />
                <div className={'cameraFab'}>
                    <IonFab vertical="bottom" horizontal="start" slot="fixed">
                        <IonFabButton onClick={async () => {
                            const savedPhoto = await takePhoto();
                            setPhoto(savedPhoto);
                        }}>
                            <IonIcon icon={camera}/>
                        </IonFabButton>
                    </IonFab>
                </div>
                <div className={'positionFab'}>
                    <IonFab vertical="bottom" horizontal="end" slot="fixed">
                        <IonFabButton onClick={async () => {
                            Geolocation.getCurrentPosition()
                                .then(position => {
                                    console.log(position)
                                    setPosition({
                                        coords: {
                                            latitude: position.coords.latitude,
                                            longitude: position.coords.longitude,
                                            accuracy: position.coords.accuracy,
                                        },
                                        timestamp: Date.now()
                                    });
                                })
                                .catch(error => {
                                    console.log(error);
                                })
                        }}>
                            <IonIcon icon={locate}/>
                        </IonFabButton>
                    </IonFab>
                </div>
                <DeleteCoffeeItemModal onConfirmDelete={() => handleDelete()} onClose={() => setShowModal(false)} showModal={showModal}/>
                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save item'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default CoffeeItemEdit;
