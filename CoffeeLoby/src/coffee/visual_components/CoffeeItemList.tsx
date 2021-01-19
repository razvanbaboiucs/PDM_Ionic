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
    IonToolbar,
    IonBadge, IonToast, CreateAnimation
} from '@ionic/react';
import { createAnimation } from '@ionic/react';
import {add, filter} from 'ionicons/icons';
import CoffeeItem from './CoffeeItem';
import { getLogger } from '../../core';
import { CoffeeItemContext } from '../data_providers/CoffeeItemProvider';
import {AuthContext} from "../../auth";
import {CoffeeItemProps} from "../data/CoffeeItemProps";
import {useNetwork} from "../../core/useNetwork";

const log = getLogger('CoffeeItemList');

const offset = 15;

const CoffeeItemList: React.FC<RouteComponentProps> = ({ history }) => {
    // initialization

    const { items, fetching, fetchingError } = useContext(CoffeeItemContext);
    const { logout } = useContext(AuthContext);
    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState(false);
    const [searchItems, setSearchItems] = useState<CoffeeItemProps[] | undefined>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(offset)
    const [filtering, setFiltering] = useState(false);
    const { networkStatus } = useNetwork();
    const [showToast, setShowToast] = useState(false);
    useEffect(()=>{
        log('search term effect')
        setPage(offset)
        fetchData();
    }, [searchTerm, items, filtering]);
    useEffect(() => {
        setShowToast(!networkStatus.connected);
    }, [])

    // animations

    const label = document.querySelector('.label');
    if (label) {
        const labelAnimation = createAnimation()
            .addElement(label)
            .duration(2000)
            .direction('alternate')
            .iterations(Infinity)
            .keyframes([
                { offset: 0, opacity: '0.2' },
                { offset: 0.5, opacity: '1' },
                { offset: 1, opacity: '0.2' }
            ]);
        labelAnimation.play();
    }

    const titleElement = document.querySelectorAll('.title');
    const markElement = document.querySelectorAll('.mark');
    if (titleElement && markElement) {
        const titleAnimation = createAnimation()
            .addElement(titleElement)
            .fromTo('transform', 'scale(0.5)', 'scale(1)');
        const markAnimation = createAnimation()
            .addElement(markElement)
            .fromTo('transform', 'scale(1.5)', 'scale(1)');
        const parentAnimation = createAnimation()
            .duration(2000)
            .addAnimation([titleAnimation, markAnimation]);
        parentAnimation.play();
    }

    // render

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
                    <IonBadge color={networkStatus.connected ? "success" : "danger"}>{networkStatus.connected ? "Online" : "Offline"}</IonBadge>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar value = {searchTerm} onIonChange = {e =>  setSearchTerm(e.detail.value || '')} placeholder = "Filter items"/>
                    <CreateAnimation
                        duration={2000}
                        iterations={Infinity}
                        keyframes={[
                            { offset: 0, transform: 'scale(1)', opacity: '0.5' },
                            { offset: 0.5, transform: 'scale(0.8)', opacity: '1' },
                            { offset: 1, transform: 'scale(1)', opacity: '0.5' }
                        ]}
                    >
                        <span className={`label`}>Speciality only</span>
                    </CreateAnimation>
                    <IonCheckbox color = "light" checked = {filtering} onIonChange={e => setFiltering(e.detail.checked)} />
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching items" />
                {searchItems && (
                    <IonList>
                        {searchItems.map(({ _id, description, date, title, recommended, mark, photo}) => {
                            return <CoffeeItem key={_id} _id={_id} title={title} description={description}
                                             recommended={recommended} date={date} mark={mark} photo={photo}
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
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message="Changes saved on local storage only"
                    position="top"
                    duration={200}
                />
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
