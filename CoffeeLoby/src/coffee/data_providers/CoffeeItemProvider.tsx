import React, {useCallback, useContext, useEffect, useReducer} from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../../core';
import { CoffeeItemProps } from '../data/CoffeeItemProps';
import {createItem, getItems, getPageItems, newWebSocket, removeItem, updateItem} from '../../api/itemApi';
import {AuthContext} from "../../auth";

const log = getLogger('CoffeeItemProvider');

type SaveItemFn = (item: CoffeeItemProps) => Promise<any>;
type DeleteItemFn = (item: CoffeeItemProps) => Promise<any>;
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
    getItemsOnPage?: GetItemsFn
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: ItemsState = {
    fetching: false,
    saving: false,
    deleting: false
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
    const { items, fetching, fetchingError, saving, savingError, deleting, deletingError } = state;
    useEffect(getItemsEffect, [token]);
    useEffect(wsEffect, [token]);
    const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
    const deleteItem = useCallback<DeleteItemFn>(deleteItemCallback, [token]);
    const value = { items, fetching, fetchingError, saving, savingError, saveItem, deleting, deleteItem, deletingError };
    log('returns');
    return (
        <CoffeeItemContext.Provider value={value}>
            {children}
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
                const items = await getItems(token);
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

    async function getItemsOnPageCallback(token: string, pageId: number) {
        let canceled = false;
        fetchItems();
        return () => {
            canceled = true;
        }

        async function fetchItems() {
            console.log('fetch items page provider' + token)
            try {
                log('fetchItems started');
                dispatch({ type: FETCH_ITEMS_ON_PAGE_STARTED });
                const items = await getPageItems(token, pageId);
                log('fetchItems succeeded');
                if (!canceled) {
                    dispatch({ type: FETCH_ITEMS_ON_PAGE_SUCCEEDED, payload: { items } });
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
            dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
        } catch (error) {
            log('saveItem failed');
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
};
