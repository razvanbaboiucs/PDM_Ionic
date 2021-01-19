import React, {useCallback, useContext, useEffect, useReducer, useState} from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../../core';
import { CoffeeItemProps } from '../data/CoffeeItemProps';
import {createItem, getItems, getPageItems, newWebSocket, removeItem, updateItem} from '../../api/itemApi';
import {AuthContext} from "../../auth";
import {useNetwork} from "../../core/useNetwork";
import {GeolocationPosition, Plugins} from "@capacitor/core";
import { IonModal, IonButton } from '@ionic/react';
import {usePhotoGallery} from "../../core/usePhoto";
const { BackgroundTask } = Plugins;


const log = getLogger('CoffeeItemProvider');

type SaveItemFn = (item: CoffeeItemProps) => Promise<any>;
type DeleteItemFn = (item: CoffeeItemProps) => Promise<any>;
type SaveItemLocalStorageFn = (item: CoffeeItemProps) => Promise<any>;
type DeleteItemLocalStorageFn = (item: CoffeeItemProps) => Promise<any>;

type GetItemsFn = (token: string, id: number) => Promise<any>;

export interface ItemsState {
    items?: CoffeeItemProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    deleting:boolean,
    savingError?: Error | null,
    deletingError?:Error|null,
    saveItem?: SaveItemFn,
    deleteItem?:DeleteItemFn,
    saveItemLocalStorage?: SaveItemLocalStorageFn,
    deleteItemLocalStorage?:DeleteItemLocalStorageFn,
    getItemsOnPage?: GetItemsFn,
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: ItemsState = {
    fetching: false,
    saving: false,
    deleting: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_ON_PAGE_STARTED = 'FETCH_ITEMS_ON_PAGE_STARTED';
const FETCH_ITEMS_ON_PAGE_SUCCEEDED = 'FETCH_ITEMS_ON_PAGE_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';
const DELETE_ITEM_SUCCEEDED ='DELETE_ITEM_SUCCEEDED';
const DELETE_ITEM_FAILED = 'DELETE_ITEM_FAILED';
const DELETE_ITEM_STARTED = 'DELETE_ITEM_STARTED';

const reducer: (state: ItemsState, action: ActionProps) => ItemsState =
    (state, { type, payload }) => {
        let items, index, item: CoffeeItemProps;
        switch (type) {
            case FETCH_ITEMS_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_ITEMS_SUCCEEDED:
                payload.items.map((item: CoffeeItemProps) => {
                    if (item._id != null) {
                        localStorage.setItem(item._id, JSON.stringify(item));
                    }
                });
                return { ...state, items: payload.items, fetching: false };
            case FETCH_ITEMS_ON_PAGE_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_ITEMS_ON_PAGE_SUCCEEDED:
                return {
                    ...state,
                    items: [
                        ...(state.items || []),
                        ...payload.items,

                    ] ,
                    fetching: false
                };
            case FETCH_ITEMS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };
            case SAVE_ITEM_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_ITEM_SUCCEEDED:
                items = [...(state.items || [])];
                item = payload.item;
                index = items.findIndex(it => it._id === item._id);
                if (item._id != null) {
                    localStorage.setItem(item._id, JSON.stringify(item));
                }
                if (index === -1) {
                    items.splice(0, 0, item);
                } else {
                    items[index] = item;
                }
                return { ...state, items, saving: false };
            case SAVE_ITEM_FAILED:
                return { ...state, savingError: payload.error, saving: false };
            case DELETE_ITEM_STARTED:
                return { ...state, deletingError: null, deleting:true };
            case DELETE_ITEM_SUCCEEDED:
                items = [...(state.items || [])];
                item = payload.item;
                index = items.findIndex(it => it._id === item._id);
                if (index !== -1) {
                    items.splice(index, 1);
                }
                return { ...state, items, deleting: false };
            case DELETE_ITEM_FAILED:
                return { ...state, deletingError: payload.error, deleting: false };
            default:
                return state;
        }
    };

export const CoffeeItemContext = React.createContext<ItemsState>(initialState);

interface ItemProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const CoffeeItemProvider: React.FC<ItemProviderProps> = ({ children }) => {
    const { token }=  useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { items, fetching, fetchingError, saving, savingError, deleting, deletingError} = state;
    const  { networkStatus } = useNetwork();
    const { writePictureFromServer } = usePhotoGallery();
    const [showModal, setShowModal] = useState(false);
    const [modalText, setModalText] = useState("");
    const [modalActionKey, setModalActionKey] = useState("");
    const [modalActionItem, setModalActionItem] = useState("");
    useEffect(getItemsEffect, [token]);
    useEffect(wsEffect, [token]);
    const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
    const deleteItem = useCallback<DeleteItemFn>(deleteItemCallback, [token]);
    const saveItemLocalStorage = useCallback<SaveItemLocalStorageFn>(saveItemLocalStorageCallback, [token]);
    const deleteItemLocalStorage = useCallback<DeleteItemLocalStorageFn>(deleteItemLocalStorageCallback, [token]);
    const value = { items, fetching, fetchingError, saving, savingError, saveItem, deleting, deleteItem, deletingError, saveItemLocalStorage, deleteItemLocalStorage};

    useEffect(() => {
        console.log("background task")
        let taskId = BackgroundTask.beforeExit(async () => {

            if (networkStatus.connected) {
                const token = localStorage.getItem("token");
                if (token !== null) {
                    for (var key in localStorage) {
                        if (key.toString().startsWith('save_')) {
                            const item = JSON.parse(localStorage.getItem(key) as string);
                            try {
                                localStorage.removeItem(key)
                                await createItem(token, item);
                            }
                            catch (e){
                                console.log(e)
                                setModalText("Version conflict for item: " + item.title);
                                setModalActionKey(key);
                                item.acquiredAt = Date.now();
                                setModalActionItem(JSON.stringify(item));
                                setShowModal(true);
                                getItemsEffect();
                            }
                        }
                        else if (key.toString().startsWith('update_')) {
                            const item = JSON.parse(localStorage.getItem(key) as string);
                            try {
                                localStorage.removeItem(key)
                                await updateItem(token, item);
                            }
                            catch (e){
                                console.log(e)
                                setModalText("Version conflict for item: " + item.title);
                                setModalActionKey(key);
                                item.acquiredAt = Date.now();
                                setModalActionItem(JSON.stringify(item));
                                setShowModal(true);
                                getItemsEffect();
                            }
                        }
                        else if (key.toString().startsWith('remove_')) {
                            const item = JSON.parse(localStorage.getItem(key) as string);
                            try {
                                setModalText("Version conflict for item: " + item.title);
                                setShowModal(true);
                                await removeItem(token, item);
                            }
                            catch (e){
                                console.log(e)
                                setModalText("Version conflict for item: " + item.title);
                                setModalActionKey(key);
                                item.acquiredAt = Date.now();
                                setModalActionItem(JSON.stringify(item));
                                setShowModal(true);
                                getItemsEffect();
                            }
                        }
                    }
                }
            }
            BackgroundTask.finish({ taskId });
        });
    }, [networkStatus.connected])

    log('returns');
    return (
        <CoffeeItemContext.Provider value={value}>
            {children}
            <IonModal isOpen={showModal} >
                <p>{ modalText }</p>
                <IonButton onClick={() => { setShowModal(false); setModalText(""); }}>Close Modal</IonButton>
                <IonButton onClick={() => { setShowModal(false); setModalText(""); localStorage.setItem(modalActionKey, modalActionItem); setModalActionKey(""); setModalActionItem(""); }}>Retry action</IonButton>
            </IonModal>
        </CoffeeItemContext.Provider>
    );

    function getItemsEffect() {
        let canceled = false;
        fetchItems();
        return () => {
            canceled = true;
        }

        async function fetchItems() {
            try {
                log('fetchItems started');
                dispatch({ type: FETCH_ITEMS_STARTED });
                let items = await getItems(token);
                items = items.map(coffee => {
                    if (coffee.photo) {
                        writePictureFromServer(coffee.photo);
                    }
                    coffee.acquiredAt = Date.now();
                    return coffee
                });
                log('fetchItems succeeded');
                if (!canceled) {

                    dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });

                }
            } catch (error) {
                log('fetchItems failed');
                dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
            }
        }
    }

    async function saveItemCallback(item: CoffeeItemProps) {
        try {
            log('saveItem started');
            dispatch({ type: SAVE_ITEM_STARTED });
            const savedItem = await (item._id ? updateItem(token, item) : createItem(token, item));
            log('saveItem succeeded');
            savedItem.acquiredAt = Date.now();
            dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
        } catch (error) {
            log('saveItem failed');
            dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
        }
    }

    async function saveItemLocalStorageCallback(item: CoffeeItemProps) {
        try {
            log('saveItem local storage started');
            dispatch({ type: SAVE_ITEM_STARTED });
            if (item._id) {
                localStorage.setItem("update_" + item._id, JSON.stringify(item));
            }
            else {
                localStorage.setItem("save_" + localStorage.length, JSON.stringify(item));
            }
            log('saveItem local storage succeeded');
            dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: item } });
        } catch (error) {
            log('saveItem local storage failed');
            dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
        }
    }

    async function deleteItemCallback(item: CoffeeItemProps) {
        try {
            log('deleteItem started');
            dispatch({ type: DELETE_ITEM_STARTED });
            await (removeItem(token, item));
            log('deleteItem succeeded');
            dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { item: item } });
        } catch (error) {
            log('deleteItem failed');
            dispatch({ type: DELETE_ITEM_FAILED, payload: { error } });
        }
    }

    async function deleteItemLocalStorageCallback(item: CoffeeItemProps) {
        try {
            log('deleteItem local storage started');
            dispatch({ type: DELETE_ITEM_STARTED });
            localStorage.setItem("remove_" + item._id, JSON.stringify(item));
            log('deleteItem local storage succeeded');
            dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { item: item } });
        } catch (error) {
            log('deleteItem local storage failed');
            dispatch({ type: DELETE_ITEM_FAILED, payload: { error } });
        }
    }


    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(token, message => {
                if (canceled) {
                    return;
                }
                const { type, payload: item } = message;
                log(`ws message, item ${type}`);
                if (type === 'created' || type === 'updated') {
                    item.acquiredAt = Date.now();
                    if (item.photo) {
                        writePictureFromServer(item.photo);
                    }
                    dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
                }
            });
        }
        return () => {
            log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        }
    }
}
