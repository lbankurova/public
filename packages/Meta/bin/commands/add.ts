import fs from 'fs';
import path from 'path';

function addPackageVersion(name: string, description: string, packageVersion: string, dependency: string, dependencyVersion: string) {

  const jsonTemplateLoc = path.join(path.dirname(path.dirname(__dirname)), 'package.json');
  let jsonContent = JSON.parse(fs.readFileSync(jsonTemplateLoc, 'utf8'));

  var data = {
    [name]: {
      dependencies: {
        [packageVersion]: {}
      },
      description: description
    }
  }

  if (dependency && dependencyVersion) {
    data[name]['dependencies'][packageVersion][dependency] = dependencyVersion.toString();
  }

  if (jsonContent.data.hasOwnProperty(name)){
    var result = {...jsonContent['data'][name]['dependencies'][packageVersion], ...data[name]['dependencies'][packageVersion]};
    jsonContent['data'][name]['dependencies'][packageVersion] = result;
    if (description) {
      jsonContent['data'][name]['description'] = data[name]['description'];
    }
  } else {
    var result = {...jsonContent['data'], ...data};
    jsonContent.data = result;
  }

  fs.writeFileSync(jsonTemplateLoc, JSON.stringify(jsonContent, null, 2) + '\n');
}

export function add(args: CreateArgs) {
  const nOptions = Object.keys(args).length - 1;
  if (nOptions < 2) return false;
  if (nOptions && !Object.keys(args).slice(1).every(op => ['package', 'description', 'ver', 'dep', 'depver'].includes(op))) return false;

  addPackageVersion(args.package, args.description, args.ver, args.dep, args.depver);
  return true;
}

interface CreateArgs {
  _: string[],
  package: string,
  ver: string,
  description?: string,
  dep?: string,
  depver?: string
}
