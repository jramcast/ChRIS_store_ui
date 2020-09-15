import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Client from '@fnndsc/chrisstoreapi';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import PluginItem from './components/PluginItem/PluginItem';
import LoadingPluginItem from './components/LoadingPluginItem/LoadingPluginItem';
import PluginsCategories from './components/PluginsCategories/PluginsCategories';
import './Plugins.css';
import LoadingContainer from '../LoadingContainer/LoadingContainer';
import LoadingContent from '../LoadingContainer/components/LoadingContent/LoadingContent';
import ChrisStore from '../../store/ChrisStore';


function setPluginFavoriteStatus(plugins, stars) {
  return plugins.map(plugin => (
    { ...plugin, isFavorite: stars.some(star => plugin.id === star.meta_id) }
  ));
}

// ==============================
// ------ PLUGINS COMPONENT -----
// ==============================

export class Plugins extends Component {
  constructor() {
    super();

    this.mounted = false;
    this.state = {
      pluginList: null,
      categories: [
        {
          name: 'Visualization',
          length: 3,
        },
        {
          name: 'Modeling',
          length: 11,
        },
        {
          name: 'Statistical Operation',
          length: 7,
        },
      ],
    };

    this.fetchPlugins = this.fetchPlugins.bind(this);
  }

  componentWillMount() {
    this.mounted = true;
  }

  componentDidMount() {
    this.fetchPlugins().catch((err) => {
      console.error(err);
    });
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetchPlugins() {
    const storeURL = process.env.REACT_APP_STORE_URL;
    const client = new Client(storeURL);
    const searchParams = {
      limit: 20,
      offset: 0,
    };

    return new Promise(async (resolve, reject) => {
      let plugins;
      let stars;
      try {
        // add plugins to pluginList as they are received

        [plugins, stars] = await Promise.all([
          await client.getPlugins(searchParams),
          await client.getPluginStars(searchParams),
        ]);

        if (this.mounted) {
          this.setState((prevState) => {
            const prevPluginList = prevState.pluginList ? prevState.pluginList : [];
            let nextPluginList = prevPluginList.concat(plugins.data);
            nextPluginList = setPluginFavoriteStatus(nextPluginList, stars.data);

            return { pluginList: nextPluginList };
          });
        }
      } catch (e) {
        return reject(e);
      }

      return resolve(plugins.data);
    });
  }


  async handlePluginFavorited(plugin) {
    const storeURL = process.env.REACT_APP_STORE_URL;
    const auth = { token: this.props.store.get('authToken') };
    const client = new Client(storeURL, auth);

    const plugins = this.state.pluginList.map(each => Object.assign({}, each));
    const favoritedPlugin = plugins.find(each => each.id === plugin.id);
    favoritedPlugin.isFavorite = true;

    this.setState({ pluginList: plugins });

    try {
      await client.createPluginStar({
        plugin_name: plugin.name,
      });
    } catch (err) {
      favoritedPlugin.isFavorite = false;
      this.setState({ pluginList: plugins });
      console.error(err);
    }
  }

  render() {
    const { pluginList, categories } = this.state;

    // Remove email from author
    const removeEmail = author => author.replace(/( ?\(.*\))/g, '');

    let pluginsFound;
    let pluginListBody;

    const { store } = this.props;
    const isLoggedIn = store ? store.get('isLoggedIn') : false;

    // Render the pluginList if the plugins have been fetched
    if (pluginList) {
      pluginListBody = pluginList.map(plugin => (
        <PluginItem
          title={plugin.title}
          id={plugin.id}
          name={plugin.name}
          author={removeEmail(plugin.authors)}
          creationDate={plugin.creation_date}
          key={plugin.name}
          isLoggedIn={isLoggedIn}
          isFavorite={plugin.isFavorite}
          onFavorited={() => this.handlePluginFavorited(plugin)}
        />
      ));

      pluginsFound = (
        <span className="plugins-found">{pluginList.length} plugins found</span>
      );
    } else {
      // Or else show the loading placeholders
      pluginsFound = (
        <LoadingContainer>
          <LoadingContent
            width="135px"
            height="30px"
            left="1em"
            top="1.5em"
            bottom="1.5em"
          />
        </LoadingContainer>
      );

      pluginListBody = new Array(6).fill().map((e, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <LoadingPluginItem key={i} />
      ));
    }

    return (
      <div className="plugins-container">
        <div className="plugins-stats">
          <div className="row plugins-stats-row">
            {pluginsFound}
            <DropdownButton
              id="sort-by-dropdown"
              title="Sort By"
              pullRight
            >
              <MenuItem eventKey="1">Name</MenuItem>
            </DropdownButton>
          </div>
        </div>
        <div className="row plugins-row">
          <PluginsCategories categories={categories} />
          <div className="plugins-list">
            {pluginListBody}
          </div>
        </div>
      </div>
    );
  }
}


Plugins.propTypes = {
  store: PropTypes.objectOf(PropTypes.object).isRequired,
};

export default ChrisStore.withStore(Plugins);
