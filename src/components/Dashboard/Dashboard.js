import React, { Component } from 'react';
import { Button, CardGrid, Spinner } from 'patternfly-react';
import PropTypes from 'prop-types';
import StoreClient from '@fnndsc/chrisstoreapi';
import './Dashboard.css';
import DashPluginCardView from './components/DashPluginCardView/DashPluginCardView';
import DashTeamView from './components/DashTeamView/DashTeamView';
import DashGitHubView from './components/DashGitHubView/DashGitHubView';
import ChrisStore from '../../store/ChrisStore';

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pluginList: null,
      loading: true,
    };
    this.initialize = this.initialize.bind(this);
  }

  componentDidMount() {
    this.fetchPlugins().catch((err) => {
      console.error(err);
    });
  }

  fetchPlugins() {
    const { store } = this.props;
    const storeURL = process.env.REACT_APP_STORE_URL;
    const client = new StoreClient(storeURL);
    const searchParams = {
      owner_username: store.get('userName'),
      limit: 1,
      offset: 0,
    };

    return new Promise(async (resolve, reject) => {
      let plugins;
      try {
        // add plugins to pluginList as they are received
        plugins = await client.getPlugins(searchParams, (onePageResponse) => {
          const onePagePlugins = onePageResponse.plugins;

          this.setState((prevState) => {
            const prevPluginList = prevState.pluginList ? prevState.pluginList : [];
            const nextPluginList = prevPluginList.concat(onePagePlugins);
            return { pluginList: nextPluginList, loading: false };
          });
        });
      } catch (e) {
        return reject(e);
      }

      return resolve(plugins);
    });
  }

  initialize() {
    const { arePluginsAvailable } = this.state;

    this.setState({
      arePluginsAvailable: !arePluginsAvailable,
    });
  }

  render() {
    const { pluginList, loading } = this.state;
    return (
      <React.Fragment>
        <div className="plugins-stats">
          <div className="row plugins-stats-row">
            <div className="title-bar">Dashboard</div>
            <div className="dropdown btn-group">
              <Button bsStyle="primary" bsSize="large" href="/create">
                Add Plugin
              </Button>
            </div>
          </div>
        </div>
        <div className="cards-pf dashboard-body">
          <CardGrid>
            <div className="dashboard-row">
              <Spinner size="lg" loading={loading}>
                <div className="dashboard-left-column">
                  <DashPluginCardView plugins={pluginList} />
                  <DashTeamView plugins={pluginList} />
                </div>
                <div className="dashboard-right-column">
                  <DashGitHubView plugins={pluginList} />
                </div>
              </Spinner>
            </div>
          </CardGrid>
        </div>
      </React.Fragment>
    );
  }
}
Dashboard.propTypes = {
  store: PropTypes.objectOf(PropTypes.object).isRequired,
};
export default ChrisStore.withStore(Dashboard);
