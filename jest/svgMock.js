/* eslint-env jest, node */
// Stand-in for .svg assets imported as React components (via the
// `\\.svg$` moduleNameMapper in jest.config.js). Renders a plain host element.
const React = require('react');

const SvgMock = props => React.createElement('SvgMock', props, props && props.children);

module.exports = { __esModule: true, default: SvgMock, ReactComponent: SvgMock };
