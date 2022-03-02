import { DataFrame } from "./dataframe";
import {
  Credentials,
  DataConnection,
  DataJob,
  DataQuery,
  Entity,
  Group,
  Model,
  Notebook,
  Project,
  Script,
  ScriptEnvironment,
  TableInfo,
  User,
  LogEvent,
  LogEventType,
  Package,
  UserSession,
  Property,
  FileInfo, HistoryEntry, ProjectOpenOptions
} from "./entities";
import {ViewLayout} from "./views/view";
import {toDart, toJs} from "./wrappers";
import {_propsToDart} from "./utils";

let api = <any>window;

/**
 * Exposes Datagrok's server-side functionality.
 *
 * See examples: {@link https://public.datagrok.ai/js/samples/dapi/projects-list}
 * */
export class Dapi {
  constructor() {
  }

  /** Retrieves entities from server by list of IDs
   *  @returns {Promise<Entity[]>} */
  getEntities(ids: string[]): Promise<Entity[]> {
    return new Promise((resolve, reject) => api.grok_Dapi_Entities_GetEntities(ids, (q: any) => {
      return resolve(q.map(toJs));
    }, (e: any) => reject(e)));
  }

  /** Entities API endpoint
   *  @type {EntitiesDataSource} */
  get entities(): EntitiesDataSource {
    return new EntitiesDataSource(api.grok_Dapi_Entities());
  }

  /** Data Queries API endpoint
   *  @type {HttpDataSource<DataQuery>} */
  get queries(): HttpDataSource<DataQuery> {
    return new HttpDataSource(api.grok_Dapi_Queries(), 'Function');
  }

  /** Data Connections API endpoint
   *  @type {HttpDataSource<DataConnection>} */
  get connections(): HttpDataSource<DataConnection> {
    return new HttpDataSource(api.grok_Dapi_Connections());
  }

  /** Credentials API endpoint
   *  @type {CredentialsDataSource} */
  get credentials(): CredentialsDataSource {
    return new CredentialsDataSource(api.grok_Dapi_Credentials());
  }

  /** Data Jobs API endpoint
   *  @type {HttpDataSource<DataJob>} */
  get jobs(): HttpDataSource<DataJob> {
    return new HttpDataSource(api.grok_Dapi_Jobs(), 'Function');
  }

  /** Jupyter Notebooks API endpoint
   *  @type {HttpDataSource<Notebook>} */
  get notebooks(): HttpDataSource<Notebook> {
    return new HttpDataSource(api.grok_Dapi_Notebooks());
  }

  /** Predictive Models API endpoint
   *  @type {HttpDataSource<Model>} */
  get models(): HttpDataSource<Model> {
    return new HttpDataSource(api.grok_Dapi_Models());
  }

  /** Packages API endpoint
   *  @type {HttpDataSource<Package>} */
  get packages(): HttpDataSource<Package> {
    return new HttpDataSource(api.grok_Dapi_Packages());
  }

  /** View Layouts API endpoint
   *  @type {LayoutsDataSource} */
  get layouts(): LayoutsDataSource {
    return new LayoutsDataSource(api.grok_Dapi_Layouts());
  }

  /** Data Table Infos API endpoint
   *  @type {TablesDataSource} */
  get tables(): TablesDataSource {
    return new TablesDataSource(api.grok_Dapi_Tables());
  }

  /** Users API endpoint
   *  @type {UsersDataSource} */
  get users(): UsersDataSource {
    return new UsersDataSource(api.grok_Dapi_Users());
  }

  /** Groups API endpoint
   *  @type {GroupsDataSource} */
  get groups(): GroupsDataSource {
    return new GroupsDataSource(api.grok_Dapi_Groups(), 'Group');
  }

  /** Permissions API endpoint
   * @type {PermissionsDataSource} */
  get permissions(): PermissionsDataSource {
    return new PermissionsDataSource();
  }

  /** Scripts API endpoint
   *  @type {HttpDataSource<Script>} */
  get scripts(): HttpDataSource<Script> {
    return new HttpDataSource(api.grok_Dapi_Scripts(), 'Function');
  }

  /** Projects API endpoint
   *  @type {HttpDataSource<Project>} */
  get projects(): ProjectsDataSource {
    return new ProjectsDataSource(api.grok_Dapi_Projects(), 'Project');
  }

  /** Environments API endpoint
   *  @type {HttpDataSource<ScriptEnvironment>} */
  get environments(): HttpDataSource<ScriptEnvironment> {
    return new HttpDataSource(api.grok_Dapi_Environments());
  }

  /** Users Data Storage API endpoint
   *  @type {UserDataStorage} */
  get userDataStorage(): UserDataStorage {
    return new UserDataStorage();
  }


  /** Users Files management API endpoint
   *  @type {FileSource} */
  get files(): FileSource {
    return new FileSource();
  }

  /** Proxies URL request via Datagrok server with same interface as "fetch".
   * @deprecated
   * @param {string} method
   * @param {string} url
   * @param {Object} headers
   * @param {Object} body
   * @returns {Promise<Object>} */
  async proxyFetch(method: string, url: string, headers: Record<string, string>, body: object = {}): Promise<object> {
    headers['Accept'] = 'application/json';
    headers['original-url'] = `${url}`;
    headers['original-method'] = method;
    let params = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    };
    return await fetch('/api/connectors/proxy', params);
  }

  /** Proxies URL request via Datagrok server with same interface as "fetch".
   * @param {String} url
   * @param {Object} params
   * @returns {Promise<Object>} */
  async fetchProxy(url: string, params?: RequestInit): Promise<Response> {
    if (params == null)
      params = {};
    if (params.headers == null)
      params.headers = {};
    if (params.method == null)
      params.method = 'GET';
    // @ts-ignore
    params.headers['original-url'] = `${url}`;
    // @ts-ignore
    params.headers['original-method'] = params.method;
    params.method = 'POST';
    return fetch('/api/connectors/proxy', params);
  }

  /** Administering API endpoint
   *  @type {AdminDataSource} */
  get admin(): AdminDataSource {
    return new AdminDataSource(api.grok_Dapi_Admin());
  }

  /** Logging API endpoint
   *  @type {HttpDataSource<LogEvent>} */
  get log(): HttpDataSource<LogEvent> {
    return new HttpDataSource(api.grok_Dapi_Log());
  }

  /** Logging API endpoint
   *  @type {HttpDataSource<LogEventType>} */
  get logTypes(): HttpDataSource<LogEventType> {
    return new HttpDataSource(api.grok_Dapi_LogTypes());
  }
}


/**
 * Common functionality for handling collections of entities stored on the server.
 * Works with Datagrok REST API, allows to get filtered and paginated lists of entities,
 * Can be extended with specific methods. (i.e. {@link UsersDataSource})
 */
export class HttpDataSource<T> {
  dart: any;
  clsName: string;

  /** @constructs HttpDataSource */
  constructor(s: any, clsName?: string | null) {
    this.dart = s;
    this.clsName = clsName ?? '';
  }

  /** Returns all entities that satisfy the filtering criteria (see {@link filter}).
   *  See examples: {@link https://public.datagrok.ai/js/samples/dapi/projects-list}
   *  Smart filter: {@link https://datagrok.ai/help/overview/smart-search} */
  list(options: {pageSize?: number, pageNumber?: number, filter?: string, order?: string} = {}): Promise<T[]> {
    if (options.pageSize !== undefined)
      this.by(options.pageSize);
    if (options.pageNumber !== undefined)
      this.page(options.pageNumber);
    if (options.filter !== undefined)
      this.filter(options.filter);
    if (options.order !== undefined)
      this.order(options.order);
    return new Promise((resolve, reject) => api.grok_DataSource_List(this.dart, (q: any) => resolve(q.map(toJs)), (e: any) => reject(e)));
  }

  /** Returns fist entity that satisfies the filtering criteria (see {@link filter}).
   *  @returns Promise<object>  */
  first(): Promise<T> {
    return new Promise((resolve, reject) => api.grok_DataSource_First(this.dart, (q: any) => resolve(toJs(q)), (e: any) => reject(e)));
  }

  /** Returns an entity with the specified id.
   *  Throws an exception if an entity does not exist, or is not accessible in the current context.
   *  Sample: {@link https://public.datagrok.ai/js/samples/data-access/save-and-load-df}
   *  @param {string} id - GUID of the corresponding object
   *  @returns {Promise<object>} - entity. */
  find(id: string): Promise<T> {
    return new Promise((resolve, reject) => api.grok_DataSource_Find(this.dart, id, (q: any) => resolve(toJs(q)), (e: any) => reject(e)));
  }

  /** Saves an entity. */
  save(e: Entity): Promise<T> {
    return new Promise((resolve, reject) => api.grok_DataSource_Save(this.dart, e.dart, (q: any) => resolve(toJs(q)), (e: any) => reject(e)));
  }

  /** Deletes an entity. */
  delete(e: Entity): Promise<void> {
    return new Promise((resolve, reject) => api.grok_DataSource_Delete(this.dart, e.dart, () => resolve(), (e: any) => reject(e)));
  }

  by(i: number): HttpDataSource<T> {
    this.dart = api.grok_DataSource_By(this.dart, i);
    return this;
  }

  /** Restricts results to the specified page number. See also {@link nextPage}. */
  page(i: number): HttpDataSource<T> {
    this.dart = api.grok_DataSource_Page(this.dart, i);
    return this;
  }

  /** Returns next page of all entities that satisfy the filtering criteria (see {@link filter}).
   *  Works only if pageSize was set during previous list() call
   *  See examples: {@link https://public.datagrok.ai/js/samples/dapi/projects-list}
   *  @returns {HttpDataSource} */
  nextPage(): HttpDataSource<T> {
    this.dart = api.grok_DataSource_NextPage(this.dart);
    return this;
  }

  /** Applies filter to current request.
   *  Also can be set with {@link list} method "options" parameter
   *  See example: {@link https://public.datagrok.ai/js/samples/dapi/projects-list}
   *  Smart filter: {@link https://datagrok.ai/help/overview/smart-search}
   *  @param {string} w
   *  @returns {HttpDataSource} */
  filter(w: string): HttpDataSource<T> {
    this.dart = api.grok_DataSource_WhereSmart(this.dart, w);
    return this;
  }

  /** Instructs data source to return results in the specified order.
   * @param {string} fieldName
   * @param {boolean} desc
   * @returns {HttpDataSource} */
  order(fieldName: string, desc: boolean = false): HttpDataSource<T> {
    this.dart = api.grok_DataSource_Order(this.dart, fieldName, desc);
    return this;
  }

  /** Includes entity in the result
   * @param {string} include
   * @returns {HttpDataSource} */
  include(include: string): HttpDataSource<T> {
    this.dart = api.grok_DataSource_Include(this.dart, _propsToDart(include, this.clsName));
    return this;
  }
}


/**
 * Functionality for handling Users collection from server and working with Users remote endpoint
 * Allows to load current user and list of all Datagrok users with filtering and pagination
 * See example: {@link https://public.datagrok.ai/js/samples/dapi/who-am-i}
 * @extends HttpDataSource
 * */
export class UsersDataSource extends HttpDataSource<User> {
  /** @constructs UsersDataSource*/
  constructor(s: any) {
    super(s);
  }

  /** Returns current user
   * @returns {Promise<User>} */
  current(): Promise<User> {
    return toJs(api.grok_UsersDataSource_Current(this.dart));
    //return new Promise((resolve, reject) => api.grok_UsersDataSource_Current(this.dart, (q: any) => resolve(s(q)), (e: any) => reject(e)));
  }

  /** Returns current session
   * @returns {Promise<UserSession>} */
  currentSession(): Promise<UserSession> {
    return api.grok_UsersDataSource_CurrentSession(this.dart);
  }
}

export class AdminDataSource {
  dart: any;
  /** @constructs AdminDataSource*/
  constructor(dart: any) {
    this.dart = dart;
  }

  /** Returns information about the services.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/admin}
   *  @returns {Promise<Map>} */
  getServiceInfos(): Promise<object[]> {
    return new Promise((resolve, reject) => api.grok_Dapi_Admin_GetServiceInfos(this.dart, (q: any) => resolve(toJs(q)), (e: any) => reject(e)));
  }
}

/**
 * Functionality for handling groups collection from server
 * Allows to manage {@link Group}
 * @extends HttpDataSource
 * */
export class GroupsDataSource extends HttpDataSource<Group> {
  /** @constructs CredentialsDataSource*/
  constructor(s: any, clsName: string) {
    super(s, clsName);
    this.include('members');
    this.include('memberships');
  }

  /** Creates a new group
   *  @param {String}  name
   *  @returns {Promise<Group>} - Group. */
  createNew(name: string): Promise<Group> {
    let g = new Group(api.grok_Group(name));
    return this.save(g);
  }

  /** Returns group user
   *  @param {Group} group
   *  @returns {Promise<Group>} - Group. */
  getUser(group: Group): Promise<Group> {
    return api.grok_Dapi_Get_GroupUser(group.dart);
  }

  /** Adds a member to the group
   * @param {Group} g
   * @param {Group} m
   * @returns {Promise} */
  async addMember(g: Group, m: Group): Promise<void> {
    g = await this.find(g.id);
    g.addMember(m);
    await this.saveRelations(g);
  }

  /** Adds an admin member to the group
   * @param {Group} g
   * @param {Group} m
   * @returns {Promise} */
  async addAdminMember(g: Group, m: Group): Promise<void> {
    g = await this.find(g.id);
    g.addAdminMember(m);
    await this.saveRelations(g);
  }

  /** Removes a member from the group
   * @param {Group} g
   * @param {Group} m
   * @returns {Promise} */
  async removeMember(g: Group, m: Group): Promise<void> {
    g = await this.find(g.id);
    g.removeMember(m);
    await this.saveRelations(g);
  }

  /** Adds the group to another one
   * @param {Group} g
   * @param {Group} parent
   * @returns {Promise} */
  async includeTo(g: Group, parent: Group): Promise<void> {
    g = await this.find(g.id);
    g.includeTo(parent);
    await this.saveRelations(g);
  }


  /** Adds the group to another one as admin
   * @param {Group} g
   * @param {Group} parent
   * @returns {Promise} */
  async includeAdminTo(g: Group, parent: Group): Promise<void> {
    g = await this.find(g.id);
    g.includeAdminTo(parent);
    await this.saveRelations(g);
  }

  /** Removes a membership from the group
   * @param {Group} g
   * @param {Group} parent
   * @returns {Promise} */
  async excludeFrom(g: Group, parent: Group): Promise<void> {
    g = await this.find(g.id);
    g.excludeFrom(parent);
    await this.saveRelations(g);
  }

  /** Saves a group with relations
   *  @param {Group} e
   *  @returns {Promise<Group>} - Group. */
  saveRelations(e: Group): Promise<Group> {
    return api.grok_GroupsDataSource_Save(this.dart, e.dart);
  }

}


/**
 * Functionality for handling entities collection from server
 * Allows to manage {@link Entity}
 * @extends HttpDataSource
 * */
export class EntitiesDataSource extends HttpDataSource<Entity> {
  /** @constructs CredentialsDataSource*/
  constructor(s: any) {
    super(s);
  }

  /** Allows to set properties for entities
   * @param {Map[]} props
   * @returns {Promise} */
  saveProperties(props: Map<Property, any>): Promise<void> {
    return new Promise((resolve, reject) => api.grok_EntitiesDataSource_SaveProperties(this.dart, props, (_: any) => resolve(), (e: any) => reject(e)));
  }

  /** Returns entity properties
   * @param {Entity} entity
   * @returns {Promise<Map>} props */
  getProperties(entity: Entity): Promise<Map<Property, any>> {
    return new Promise((resolve, reject) => api.grok_EntitiesDataSource_GetProperties(this.dart, entity.dart, (p: Map<Property, any> | PromiseLike<Map<Property, any>>) => resolve(p), (e: any) => reject(e)));
  }

  /** Deletes entity properties
   * @param {Map[]} props
   * @returns {Promise} */
  deleteProperties(props: Map<Property, any>): Promise<void> {
    return new Promise((resolve, reject) => api.grok_EntitiesDataSource_DeleteProperties(this.dart, props, (_: any) => resolve(), (e: any) => reject(e)));
  }
}

/**
 * Functionality for handling credentials collection from server and working with credentials remote endpoint
 * Allows to manage {@link Credentials}
 * See also: {@link https://datagrok.ai/help/govern/security}
 * @extends HttpDataSource
 * */
export class CredentialsDataSource extends HttpDataSource<Credentials> {
  /** @constructs CredentialsDataSource*/
  constructor(s: any) {
    super(s);
  }

  /** Returns credentials for entity
   * @param {Entity} e
   * @returns {Promise<Credentials>} */
  forEntity(e: Entity): Promise<Credentials> {
    return new Promise((resolve, reject) => api.grok_CredentialsDataSource_ForEntity(this.dart, e.dart, (c: any) => resolve(toJs(c)), (e: any) => reject(e)));
  }
}

/**
 * Functionality for handling layouts collection from server
 * Allows to manage {@link ViewLayout}
 * @extends HttpDataSource
 * */
export class LayoutsDataSource extends HttpDataSource<ViewLayout> {
  /** @constructs CredentialsDataSource*/
  constructor(s: any) {
    super(s);
  }

  /** Returns layouts that applicable to the table
   * @param {DataFrame} t
   * @returns {Promise<ViewLayout[]>} */
  getApplicable(t: DataFrame): Promise<ViewLayout[]> {
    return api.grok_LayoutsDataSource_Applicable(this.dart, t.dart);
  }
}

export class PermissionsDataSource {
  constructor() {
  };

  /** Gets all the permissions granted on entity
   * @param {Entity} e
   * @returns {Promise<Map>} permissions
   * */
  // { [key:string]:number; }
  get(e: Entity): Promise<Map<string, Group[]>> {
    return new Promise((resolve, reject) =>
      api.grok_Dapi_Get_Permissions(e.dart, (data: any) => {
        data.view = toJs(data.view);
        data.edit = toJs(data.edit);
        resolve(data);
      }, (e: any) => reject(e)));
  }

  /** Grants permission on entity to the group
   * @param {Entity} e
   * @param {Group} g
   * @param {boolean} edit allow to edit entity
   * @returns {Promise}
   * */
  grant(e: Entity, g: Group, edit: boolean): Promise<any> {
    return new Promise((resolve, reject) =>
      api.grok_Dapi_Set_Permission(e.dart, g.dart, edit, (data: any) => resolve(data), (e: any) => reject(e)));
  }

  /** Revokes permission on entity from the group
   * @param {Entity} e
   * @param {Group} g
   * @returns {Promise}
   * */
  revoke(g: Group, e: Entity): Promise<any> {
    return new Promise((resolve, reject) =>
      api.grok_Dapi_Delete_Permission(e.dart, g.dart, (data: any) => resolve(data), (e: any) => reject(e)));
  }
}

/**
 * Functionality for working with remote Users Data Storage
 * Remote storage allows to save key-value pairs on the Datagrok server for further use
 * */
export class UserDataStorage {
  constructor() {
  }

  /** Saves a single value to Users Data Storage
   * @param {string} name Storage name
   * @param {string} key
   * @param {string} value
   * @param {boolean} currentUser Value should be available only for current user
   * @returns {Promise}*/
  postValue(name: string, key: string, value: string, currentUser: boolean = true): Promise<void> {
    return api.grok_Dapi_UserDataStorage_PostValue(name, key, value, currentUser);
  }

  /** Saves a map to Users Data Storage, will be appended to existing data
   * @param {string} name Storage name
   * @param {Map} data
   * @param {boolean} currentUser Value should be available only for current user
   * @returns {Promise}*/
  post(name: string, data: any, currentUser: boolean = true): Promise<void> {
    return api.grok_Dapi_UserDataStorage_Post(name, data, currentUser);
  }

  /** Saves a map to Users Data Storage, will replace existing data
   * @param {string} name Storage name
   * @param {Map} data
   * @param {boolean} currentUser Value should be available only for current user
   * @returns {Promise}*/
  put(name: string, data: any, currentUser: boolean = true): Promise<void> {
    return api.grok_Dapi_UserDataStorage_Put(name, data, currentUser);
  }

  /** Retrieves a map from Users Data Storage
   * @param {string} name - Storage name
   * @param {boolean} currentUser - get a value from a current user storage
   * @returns {Promise<Map>} */
  get(name: string, currentUser: boolean = true): Promise<any> {
    return api.grok_Dapi_UserDataStorage_Get(name, currentUser);
  }

  /** Retrieves a single value from Users Data Storage
   * @param {string} name Storage name
   * @param {string} key Value key
   * @param {boolean} currentUser get a value from a current user storage
   * @returns {Promise<string>} */
  getValue(name: string, key: string, currentUser: boolean = true): Promise<string> {
    return api.grok_Dapi_UserDataStorage_GetValue(name, key, currentUser);
  }

  /** Removes a single value from Users Data Storage
   * @param {string} name Storage name
   * @param {string} key Value key
   * @param {boolean} currentUser get a value from a current user storage
   * @returns {Promise} */
  remove(name: string, key: string, currentUser: boolean = true): Promise<void> {
    return api.grok_Dapi_UserDataStorage_Delete(name, key, currentUser);
  }
}


/**
 * Functionality for working with remote projects
 * @extends HttpDataSource
 * */
export class ProjectsDataSource extends HttpDataSource<Project> {
  /** @constructs TablesDataSource*/
  constructor(s: any, clsName: string) {
    super(s, clsName);
    this.include('children');
  }

  /** Gets recent projects datasource
   * @returns {HttpDataSource<HistoryEntry>} */
  get recent(): HttpDataSource<HistoryEntry> {
     return new HttpDataSource<HistoryEntry>(api.grok_Dapi_RecentProjects());
  }

  /** Opens the specified project. */
  open(name: string, options?: ProjectOpenOptions): Promise<Project> {
    return this
      .filter(name)
      .first()
      .then(p => p.open(options));
  }

  /** Saves the Project */
  save(e: Entity, options?: {saveRelations?: boolean}): Promise<Project> {
    options ??= {};
    options.saveRelations ??= true;
    return toJs(api.grok_ProjectsDataSource_Save(this.dart, e.dart, options!.saveRelations));
  }

}

/**
 * Functionality for working with remote tables
 * @extends HttpDataSource
 * */
export class TablesDataSource extends HttpDataSource<TableInfo> {
  /** @constructs TablesDataSource*/
  constructor(s: any) {
    super(s);
  }

  /** Saves a dataframe remotely.
   * Sample: {@link https://public.datagrok.ai/js/samples/data-access/save-and-load-df}
   * @param {DataFrame} dataFrame
   * @returns {Promise<string>} */
  uploadDataFrame(dataFrame: DataFrame): Promise<string> {
    return api.grok_Dapi_TablesDataSource_UploadDataFrame(dataFrame.dart);
  }

  /** Loads a dataframe by id.
   * Sample: {@link https://public.datagrok.ai/js/samples/data-access/save-and-load-df}
   * @param {string} id - dataframe id
   * @returns {Promise<DataFrame>} */
  getTable(id: string): Promise<DataFrame> {
    return api.grok_Dapi_TablesDataSource_GetTable(id);
  }

}

export class FileSource {
  private readonly root: string;
  constructor(root: string = '') {
    this.root = root;
  };

  /** Checks if a file exists.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param {FileInfo | string} file
   * @returns {Promise<Boolean>} */
  exists(file: FileInfo | string): Promise<boolean> {
    file = this.setRoot(file);
    return api.grok_Dapi_UserFiles_Exists(file);
  }

  private setRoot(file: FileInfo | string): string {
    if (typeof (file) == 'string') {
      file = `${this.root}${this.root != '' ? '/' : ''}${file}`;
      return <string>file;
    } else {
      file = `${this.root}${this.root != '' ? '/' : ''}${file.path}`;
      return <string>file;
    }
  }

  /** Deletes a file.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param {FileInfo | string} file
   * @returns {Promise} */
  delete(file: FileInfo | string): Promise<void> {
    file = this.setRoot(file);
    return api.grok_Dapi_UserFiles_Delete(file);
  }

  /** Moves a file.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param {FileInfo[] | string[]} files
   * @param {string} newPath
   * @returns {Promise} */
  move(files: FileInfo[] | string[], newPath: string): Promise<void> {
    for (let i = 0; i < files.length; i++)
      files[i] = this.setRoot(files[i]);
    newPath = this.setRoot(newPath);

    return api.grok_Dapi_UserFiles_Move(files, newPath);
  }

  /** Renames a file.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param { FileInfo | string} file
   * @param {string} newName
   * @returns {Promise} */
  rename(file: FileInfo | string, newName: string): Promise<void> {
    file = this.setRoot(file);
    newName = this.setRoot(newName);

    return api.grok_Dapi_UserFiles_Rename(file, newName);
  }

  /** Lists files according to a search pattern.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param {FileInfo | string} file - folder
   * @param {boolean} recursive - whether to search in folders recursively
   * @param {string} searchPattern - search pattern, such as "*.csv"
   * @returns {Promise<FileInfo[]>} */
  async list(file: FileInfo | string, recursive: boolean, searchPattern: string | null = null): Promise<FileInfo[]> {
    file = this.setRoot(file);
    return toJs(await api.grok_Dapi_UserFiles_List(file, recursive, searchPattern, this.root));
  }

  /** Reads a file as string.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param {FileInfo | string} file
   * @returns {Promise<String>} */
  readAsText(file: FileInfo | string): Promise<string> {
    file = this.setRoot(file);

    return api.grok_Dapi_UserFiles_ReadAsText(file);
  }

  /** Reads a file as bytes.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param {FileInfo | string} file
   * @returns {Promise<Uint8Array>} */
  readAsBytes(file: FileInfo | string): Promise<Uint8Array> {
    file = this.setRoot(file);

    return api.grok_Dapi_UserFiles_ReadAsBytes(file);
  }

  /** Reads a d42 file as a list of dataframes.
   * @param {FileInfo | string} file
   * @returns {Promise<DataFrame[]>} */
  async readBinaryDataFrames(file: FileInfo | string): Promise<DataFrame[]> {
    file = this.setRoot(file);
    const dfList = await api.grok_Dapi_UserFiles_ReadBinaryDataFrames(file);
    return dfList.map((t: any) => new DataFrame(t));
  }

  /** Writes a file.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param {FileInfo | string} file
   * @param {Array<number>} blob
   * @returns {Promise} */
  write(file: FileInfo | string, blob: number[]): Promise<void> {
    return api.grok_Dapi_UserFiles_Write(file, blob);
  }

  /** Writes a text file.
   * Sample: {@link https://public.datagrok.ai/js/samples/dapi/files}
   * @param {FileInfo | string} file
   * @param {string} data
   * @returns {Promise} */
  writeAsText(file: FileInfo | string, data: string): Promise<void> {
    file = this.setRoot(file);

    return api.grok_Dapi_UserFiles_WriteAsText(file, data);
  }
}

export class Logger {
  putCallback: any;

  constructor(putCallback?: any) {
    this.putCallback = putCallback;
  }

  /** Saves audit record to Datagrok back-end
   * @param {string} message
   * @param {object} params
   * @param {string} type = 'log'
   * */
  log(message: string, params: object, type?: string): void {
    if (type == null)
      type = 'log';
    let msg = {message: message, params: params, type: type};
    if (this.putCallback != null)
      this.putCallback(msg);

    api.grok_Audit(msg.type, msg.message, toDart(msg.params));
  }
}
