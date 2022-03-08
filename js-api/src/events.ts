import * as rxjs from 'rxjs';
import * as rxjsOperators from 'rxjs/operators';
import { toJs } from './wrappers';
import { Observable } from "rxjs";
import {FileInfo, Package} from './entities';
import { Accordion, Dialog } from "./widgets";
import { View, ViewLayout } from './views/view';
import { Viewer } from "./viewer";
import { Column } from "./dataframe";

let api = <any>window;

export function debounce<T>(observable: rxjs.Observable<T>, milliseconds: number = 100): rxjs.Observable<T> {
  return observable.pipe(rxjsOperators.debounceTime(milliseconds));
}

export function __obs(eventId: string, object: any = null): Observable<any> {
  if (object == null) {
    let observable = rxjs.fromEventPattern(
      function (handler) {
        return api.grok_OnEvent(eventId, function (x: any) {
          handler(toJs(x));
        });
      },
      function (handler, dart) {
        new StreamSubscription(dart).cancel();
      }
    );
    return observable;
  } else {
    let o2 = rxjs.fromEventPattern(
      function (handler) {
        return api.grok_OnObjectEvent(object, eventId, function (x: any) {
          handler(toJs(x));
        });
      },
      function (handler, dart) {
        new StreamSubscription(dart).cancel();
      }
    );
    return o2;
  }
}

/**
 * Converts Dart stream to rxjs.Observable.
 * @param {Object} dartStream
 * @returns {rxjs.Observable}
 * */
export function observeStream(dartStream: any): Observable<any> {
  let observable = rxjs.fromEventPattern(
    function (handler) {
      return api.grok_Stream_Listen(dartStream, function (x: any) {
        handler(toJs(x));
      });
    },
    function (handler, dart) {
      new StreamSubscription(dart).cancel();
    }
  );
  return observable;
}


/** Global platform events. */
export class Events {
  private customEventBus: EventBus;

  constructor() {
    this.customEventBus = new EventBus();
  }

  /** Observes platform events with the specified eventId.
   * Sample: {@link https://public.datagrok.ai/js/samples/ui/ui-events}
   * @returns {rxjs.Observable} */
  onEvent(eventId: string): rxjs.Observable<any> {
    return __obs(eventId);
  }

  /** Observes custom events with the specified eventId.
   * Sample: {@link https://public.datagrok.ai/js/samples/events/custom-events}
   * @returns {rxjs.Observable} */
  onCustomEvent(eventId: string): rxjs.Observable<any> {
    return this.customEventBus.onEvent(eventId);
  }

  /** Observes events with the specified eventId.
   * Sample: {@link https://public.datagrok.ai/js/samples/events/custom-events}
   * @param {string} eventId
   * @param args - event arguments*/
  fireCustomEvent(eventId: string, args: any): void { this.customEventBus.fire(eventId, args); }

  /** Sample: {@link https://public.datagrok.ai/js/samples/events/viewer-events} */
  get onContextMenu(): rxjs.Observable<any> { return __obs('d4-context-menu'); }

  get onContextMenuClosed(): rxjs.Observable<any> { return __obs('d4-menu-closed'); }

  get onCurrentViewChanged(): rxjs.Observable<any> { return __obs('d4-current-view-changed'); }

  get onCurrentCellChanged(): rxjs.Observable<any> { return __obs('d4-current-cell-changed'); }

  get onDialogShown(): rxjs.Observable<Dialog> { return __obs('d4-dialog-showed'); }

  /** Sample: {@link https://public.datagrok.ai/js/samples/events/global-events} */
  get onTableAdded(): rxjs.Observable<any> { return __obs('d4-table-added'); }

  get onTableRemoved(): rxjs.Observable<any> { return __obs('d4-table-removed'); }

  get onQueryStarted(): rxjs.Observable<any> { return __obs('d4-query-started'); }

  get onQueryFinished(): rxjs.Observable<any> { return __obs('d4-query-finished'); }

  get onViewChanged(): rxjs.Observable<any> { return __obs('grok-view-changed'); }

  get onViewAdded(): rxjs.Observable<View> { return __obs('grok-view-added'); }

  get onViewAdding(): rxjs.Observable<View> { return __obs('grok-view-adding'); }

  get onViewRemoved(): rxjs.Observable<View> { return __obs('grok-view-removed'); }

  get onViewRenamed(): rxjs.Observable<View> { return __obs('grok-view-renamed'); }

  get onResetFilterRequest(): rxjs.Observable<any> { return __obs('d4-reset-filter-request'); }

  /** Sample: {@link https://public.datagrok.ai/js/samples/events/layout-events} */
  get onViewLayoutGenerated(): rxjs.Observable<ViewLayout> { return __obs('d4-view-layout-generated'); }

  /** Sample: {@link https://public.datagrok.ai/js/samples/events/layout-events} */
  get onViewLayoutApplying(): rxjs.Observable<ViewLayout> { return __obs('d4-view-layout-applying'); }

  /** Sample: {@link https://public.datagrok.ai/js/samples/events/layout-events} */
  get onViewLayoutApplied(): rxjs.Observable<ViewLayout> { return __obs('d4-view-layout-applied'); }

  /** File in the file share has been edited and saved by the user. */
  get onFileEdited(): rxjs.Observable<FileInfo> { return __obs('grok-file-edited'); }

  get onCurrentProjectChanged(): rxjs.Observable<any> { return __obs('grok-current-project-changed'); }

  get onProjectUploaded(): rxjs.Observable<any> { return __obs('grok-project-uploaded'); }

  get onProjectSaved(): rxjs.Observable<any> { return __obs('grok-project-saved'); }

  get onProjectOpened(): rxjs.Observable<any> { return __obs('grok-project-opened'); }

  get onProjectClosed(): rxjs.Observable<any> { return __obs('grok-project-closed'); }

  get onProjectModified(): rxjs.Observable<any> { return __obs('grok-project-modified'); }

  get onTooltipRequest(): rxjs.Observable<any> { return __obs('d4-tooltip-request'); }

  get onTooltipShown(): rxjs.Observable<any> { return __obs('d4-tooltip-shown'); }

  get onTooltipClosed(): rxjs.Observable<any> { return __obs('d4-tooltip-closed'); }

  get onViewerAdded(): rxjs.Observable<EventData<ViewerArgs>> { return __obs('d4-viewer-added'); }

  get onViewerClosed(): rxjs.Observable<EventData<ViewerArgs>> { return __obs('d4-viewer-closed'); }

  get onFormCreating(): rxjs.Observable<EventData<ColumnsArgs>> { return __obs('d4-form-creating'); }

  get onAccordionConstructed(): rxjs.Observable<Accordion> { return __obs('d4-accordion-constructed'); }

  get onPackageLoaded(): rxjs.Observable<Package> { return __obs('d4-package-loaded'); }
}

/*

export class Stream {
  private dart: any;
  constructor(dart: any) {
    this.dart = dart;
  }

  listen(onData: any) {
    return new StreamSubscription(api.grok_Stream_Listen(this.dart, onData));
  }

  toObservable() {
    let observable = rxjs.fromEventPattern(
      function (handler) {
        return api.grok_OnEvent(eventId, function (x) {
          handler(w ? toJs(x) : x);
        });
      },
      function (handler, streamSubscription) {
        streamSubscription.cancel();
      }
    );
    return observable;
  }
}

*/

/** Subscription to an event stream. Call [cancel] to stop listening. */
export class StreamSubscription {
  private dart: any;
  constructor(dart: any) {
    this.dart = dart;
  }

  unsubscribe(): void { this.cancel(); }

  cancel(): void { api.grok_Subscription_Cancel(this.dart); }
}

/** Event arguments. {@see args} contains event details.
 *  Sample: {@link https://public.datagrok.ai/js/samples/events/global-events}*/
export class EventData<TArgs = any> {
  public dart: any;

  constructor(dart: any) {
    this.dart = dart;
  }

  /** @type {UIEvent} */
  get causedBy(): UIEvent {
    return api.grok_EventData_Get_CausedBy(this.dart);
  }

  /** Whether the default event handling is prevented. See also {@link preventDefault}
   * @returns {boolean} */
  get isDefaultPrevented(): boolean {
    return api.grok_EventData_Get_IsDefaultPrevented(this.dart);
  }

  /** Prevents default handling. See also {@link isDefaultPrevented}.
   * Sample: {@link https://public.datagrok.ai/js/samples/events/prevented-event} */
  preventDefault(): void {
    api.grok_EventData_PreventDefault(this.dart);
  }

  /** Event details. */
  get args(): { [index: string]: TArgs } {
    let x = api.grok_EventData_Get_Args(this.dart);
    let result: { [index: string]: any } = {};
    for (const property in x)
      if (x.hasOwnProperty(property))
        result[property] = toJs(x[property]);
    return result;
  }
}

/** Central event hub. */
export class EventBus {
  private _streams: Map<any, any>;

  constructor() {
    this._streams = new Map();
  }

  onEvent(type: string): rxjs.Observable<any> {
    let subject = this._getSubject(type);

    return new rxjs.Observable(function subscribe(observer) {
      subject.subscribe({
        next: (v: any) => observer.next(v),
        error: (err: any) => observer.error(err),
        complete: () => observer.complete()
      });
    });
  }

  _getSubject(type: string): any {
    if (!this._streams.has(type)) {
      let s = new rxjs.Subject();
      this._streams.set(type, s);
      return s;
    }

    return this._streams.get(type);
  }

  fire(type: string, data: any): void {
    let subject = this._getSubject(type);
    subject.next(data);
  }
}

export function _sub(dart: any): StreamSubscription {
  return new StreamSubscription(dart);
}

export interface MapChangeArgs<K, V> {
  source: any;
  change: string;
  key: K;
  value: V;
}

export interface ViewerArgs {
  viewer: Viewer;
}

export class ColumnsArgs extends EventData {
  get columns(): Column[] {
    return toJs(api.grok_ColumnsArgs_Get_Columns(this.dart));
  }

  set columns(list: Column[]) {
    api.grok_ColumnsArgs_Set_Columns(this.dart, list);
  }
}
