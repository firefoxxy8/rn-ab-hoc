import React from 'react';
import PropTypes from 'prop-types';
import { View, AsyncStorage } from 'react-native';

export const LOCAL_STORAGE_KEY = 'abhoc-variant';
export const noop = () => null;

export default (experiment, ...variants) => {
  class AbHoc extends React.Component {
    static findVariant(variant) {
      const chosenVariant = variants.find(v => v.variant === variant);
      if (!chosenVariant) {
        throw new Error(
          `The variant named "${variant}" doesn't exist in the current experiment "${experiment}"`,
        );
      }
      return chosenVariant;
    }

    static randomizeVariant() {
      const random = Math.random() * (variants.length - 1);
      const index = Math.round(random, 10);
      return variants[index];
    }

    constructor(props) {
      super(props);
      this.state = { variant: null, component: View };
    }

    async componentDidMount() {
      const { variant } = this.props;
      if (variant) {
        const chosenVariant = AbHoc.findVariant(variant);
        return this.persistVariant(chosenVariant);
      }
      const randomVariant = AbHoc.randomizeVariant(variant);
      return this.shouldPersist(randomVariant);
    }

    async persistVariant({ variant, component }) {
      await AsyncStorage.setItem(`${LOCAL_STORAGE_KEY}-${experiment}`, variant);
      this.props.onVariantSelect(variant);
      return this.setState({ variant, component });
    }

    async shouldPersist({ variant, component }) {
      const localVariantKey = await AsyncStorage.getItem(`${LOCAL_STORAGE_KEY}-${experiment}`);

      if (!localVariantKey) {
        return this.persistVariant({ variant, component });
      }
      const localVariant = AbHoc.findVariant(localVariantKey);
      this.props.onVariantSelect(localVariant.variant);
      return this.setState({ ...localVariant });
    }

    render() {
      const { component } = this.state;
      const Component = component;
      return <Component {...this.props} />;
    }
  }

  AbHoc.propTypes = {
    variant: PropTypes.string,
    onVariantSelect: PropTypes.func,
  };

  AbHoc.defaultProps = {
    variant: null,
    onVariantSelect: noop,
  };

  return AbHoc;
};
