import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic coffee to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import CoffeeItemList from "./coffee/visual_components/CoffeeItemList";
import {CoffeeItemEdit} from "./coffee";
import {CoffeeItemProvider} from "./coffee/data_providers/CoffeeItemProvider";
import {AuthProvider, Login, PrivateRoute} from "./auth";

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <AuthProvider>
                    <Route path="/login" component={Login} exact={true}/>
                    <CoffeeItemProvider>
                        <PrivateRoute path="/coffees" component={CoffeeItemList} exact={true} />
                        <PrivateRoute path="/coffee" component={CoffeeItemEdit} exact={true} />
                        <PrivateRoute path="/coffee/:id" component={CoffeeItemEdit} exact={true} />
                    </CoffeeItemProvider>
                    <Route exact path="/" render={() => <Redirect to="/coffees" />} />
                </AuthProvider>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
);

export default App;
