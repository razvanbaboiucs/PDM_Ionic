import React, { useContext, useEffect, useState } from 'react';
import {IonCheckbox, IonLabel} from '@ionic/react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { getLogger } from '../../core';
import { CoffeeItemContext } from '../data_providers/CoffeeItemProvider';
import { RouteComponentProps } from 'react-router';
import { CoffeeItemProps } from '../data/CoffeeItemProps';

const log = getLogger('ItemEdit');

interface ItemEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const CoffeeItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
    const { items, saving, savingError, saveItem, deleteItem } = useContext(CoffeeItemContext);
    const [title, setTitle] = useState('');
    const [mark, setMark] = useState(0);
    const [description, setDescription] = useState('');
    const [recommended, setRecommended] = useState(true);
    const [item, setItem] = useState<CoffeeItemProps>();
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
        }
    }, [match.params.id, items]);
    const handleSave = () => {
        const editedItem = item ? { ...item, title, mark, description, recommended, date : new Date().toLocaleDateString() } : { title, mark, description, recommended, date : new Date().toLocaleDateString() };
        saveItem && saveItem(editedItem).then(() => history.goBack());
    };
    const handleDelete = () => {
        const editedItem = item ? { ...item, title, mark, description, recommended, date : new Date().toLocaleDateString() } : { title, mark, description, recommended, date : new Date().toLocaleDateString() };
        deleteItem && deleteItem(editedItem).then(() => history.goBack());
    };
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            Save
                        </IonButton>
                        <IonButton onClick={handleDelete}>
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
                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save item'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default CoffeeItemEdit;
