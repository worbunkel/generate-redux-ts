const fs = require('fs');
const _ = require('lodash');
const path = require('path');

const thisFilePath = _.initial(_.split(_.nth(process.argv, 1), '/')).join('/');
const pathArg = _.nth(process.argv, 2);

const pathToFile = _.initial(_.split(pathArg, '/')).join('/') + '/';
const nameParam = _.last(_.split(pathArg, '/'));

const convertToHyphenated = (str) => {
  if (_.includes(str, '-')) {
    return str.toLowerCase();
  }
  const letters = _.split(str, '');
  const firstLetter = _.first(letters).toLowerCase();
  const camelCaseStr = _.concat(firstLetter, _.tail(letters)).join('');
  return _.replace(camelCaseStr, /([A-Z])/g, '-$1').toLowerCase();
};

const convertToCapitalized = (str) => {
  const hyphenatedStr = convertToHyphenated(str);
  return _.map(_.split(hyphenatedStr, '-'), _.capitalize).join('');
};

const convertToCamelCase = (str) => {
  const hyphenatedStr = convertToHyphenated(str);
  return _.map(_.split(hyphenatedStr, '-'), (val, index) => _.isEqual(index, 0) ? val : _.capitalize(val)).join('');
};

const convertToLowerCaseSpaced = (str) => _.replace(convertToHyphenated(str), /-/g, ' ');

const hyphenatedNameParam = convertToHyphenated(nameParam);
const capitalizedNameParam = convertToCapitalized(nameParam);
const camelCaseNameParam = convertToCamelCase(nameParam);
const lowerCaseSpacedNameParam = convertToLowerCaseSpaced(nameParam);

let pathToTemplates = path.join(thisFilePath, 'templates') + '/';
let actionsTemplate;
try {
  actionsTemplate = fs.readFileSync(`${pathToTemplates}actions.ts.template`, 'utf-8');
} catch (e) {
  console.error(e);
  try {
    pathToTemplates = './node_modules/generate-redux-ts/dist/templates/';
    fs.readFileSync(`${pathToTemplates}actions.ts.template`, 'utf-8');
    actionsTemplate = fs
  } catch (e) {
    console.error(e);
    throw new Error('Error reading files');
  }
}

const connectTemplate = fs.readFileSync(`${pathToTemplates}connect.ts.template`, 'utf-8');
const indexTemplate = fs.readFileSync(`${pathToTemplates}index.ts.template`, 'utf-8');
const reducerSpecTemplate = fs.readFileSync(`${pathToTemplates}reducer.spec.ts.template`, 'utf-8');
const reducerTemplate = fs.readFileSync(`${pathToTemplates}reducer.ts.template`, 'utf-8');
const stateTemplate = fs.readFileSync(`${pathToTemplates}state.ts.template`, 'utf-8');

const templates = [
  { name: 'actions.ts', template: actionsTemplate },
  { name: 'connect.ts', template: connectTemplate },
  { name: 'index.ts', template: indexTemplate },
  { name: 'reducer.spec.ts', template: reducerSpecTemplate },
  { name: 'reducer.ts', template: reducerTemplate },
  { name: 'state.ts', template: stateTemplate },
];

const replaceTemplates = (templateObj) => {
  const { template } = templateObj;
  let resTemplate = _.replace(template, /<grts-hyphenated>/g, hyphenatedNameParam);
  resTemplate = _.replace(resTemplate, /<grts-c>/g, capitalizedNameParam);
  resTemplate = _.replace(resTemplate, /<grts-cc>/g, camelCaseNameParam);
  resTemplate = _.replace(resTemplate, /<grts-lc-spaced>/g, lowerCaseSpacedNameParam);
  return { name: templateObj.name, template: resTemplate };
}

const resultTemplates = _.map(templates, replaceTemplates);

_.each(resultTemplates, (resTemplate) => {
  try {
    const folders = _.split(pathToFile + hyphenatedNameParam, '/');
    folders.forEach((folder, index) => {
      try {
        fs.mkdirSync('./' + _.slice(folders, 0, index + 1).join('/'));
      } catch (e) {
        if (!_.isEqual(e.code, 'EEXIST')) {
          console.error(e);
          throw new Error('Error creating folders');
        }
      }
    });
    fs.writeFileSync(path.join(process.cwd(), pathToFile, hyphenatedNameParam, hyphenatedNameParam + '.' + resTemplate.name), resTemplate.template, 'utf-8');
  } catch (e) {
    console.error(e);
    throw new Error('Error writing files');
  }
});
