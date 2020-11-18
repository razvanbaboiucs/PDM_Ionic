import React, {useContext, useEffect, useState} from 'react';
import { RouteComponentProps } from 'react-router';
import {
    IonCheckbox,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonLabel,
    IonList, IonListHeader, IonLoading,
    IonPage, IonSearchbar,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import {add, filter} from 'ionicons/icons';
import CoffeeItem from './CoffeeItem';
import { getLogger } from '../../core';
import { CoffeeItemContext } from '../data_providers/CoffeeItemProvider';
import {AuthContext} from "../../auth";
import {CoffeeItemProps} from "../data/CoffeeItemProps";

const log = getLogger('CoffeeItemList');

const offset = 15;

const CoffeeItemList: React.FC<RouteComponentProps> = ({ history }) => {
    const { items, fetching, fetchingError } = useContext(CoffeeItemContext);
    const { logout } = useContext(AuthContext);
    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState(false);
    const [searchItems, setSearchItems] = useState<CoffeeItemProps[] | undefined>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(offset)
    const [filtering, setFiltering] = useState(false);
    useEffect(()=>{
        log('search term effect')
        setPage(offset)
        fetchData();
    }, [searchTerm, items, filtering]);
    log('render');

    function fetchData(){
        const result = items?.filter(item => {
            if (item.title.toLowerCase().includes(searchTerm) && (!filtering || (item.mark && item.mark > 6))) {
                return item;
            }
        })
        setSearchItems(result?.slice(0, page))
        setPage(page + offset);
        if (result && page > result?.length) {
            setDisableInfiniteScroll(true);
            setPage(result.length);
        }
        else {
            setDisableInfiniteScroll(false);
        }
    }

    async function searchNext($event:CustomEvent<void>){
        fetchData();
        ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Coffee Lobby</IonTitle>
                    <IonSearchbar value = {searchTerm} onIonChange = {e =>  setSearchTerm(e.detail.value || '')} placeholder = "Filter items"/>
                    <IonLabel>Speciality only</IonLabel>
                    <IonCheckbox color = "light" checked = {filtering} onIonChange={e => setFiltering(e.detail.checked)} />
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching items" />
                {searchItems && (
                    <IonList>
                        <IonListHeader lines="inset">
                            <IonLabel>Title</IonLabel>
                            <IonLabel>Mark</IonLabel>
                            <IonLabel class = "date-column">Date</IonLabel>
                            <IonLabel class = "mark-column">Recommended?</IonLabel>
                        </IonListHeader>
                        {searchItems.map(({ _id, description, date, title, recommended, mark}) => {
                            return <CoffeeItem key={_id} _id={_id} title={title} description={description}
                                             recommended={recommended} date={date} mark={mark}
                                             onEdit={id => history.push(`/coffee/${id}`)}/>
                        })}
                    </IonList>
                )}
                <IonInfiniteScroll threshold = "100px" disabled={disableInfiniteScroll}
                                   onIonInfinite = {(e:CustomEvent<void>)=>searchNext(e)}>
                    <IonInfiniteScrollContent
                        loadingText="Loading more coffees...">
                    </IonInfiniteScrollContent>
                </IonInfiniteScroll>
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch items'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/coffee')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
                <IonFab vertical="bottom" horizontal="start" slot="fixed">
                    <IonFabButton onClick={handleLogout}>
                        Logout
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );

    function handleLogout() {
        log("logout");
        logout?.();
    }
};

export default CoffeeItemList;
