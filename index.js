const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)
const unaryId = (payload) => ({payload})

const DEFAULT_CONFIG = {
    strictInvariant: true,
    actions: {
        'get': null,
        'getById': null,
        'set': (_, {payload}) => payload,
        'put': (state, {payload}) => ({...state, ...payload}),
        'update': (state, {payload: {id, value}}) => ({...state, [id]: value}),
        'remove': (state, {payload}) => {
            const s = {...state}
            delete s[payload]
            return s
        },
    },
    reducerName: (namespace) => {
        return capitalize(namespace);
    },
    actionCreator: (namespace) => {
        return (actionName, payloadCreator = unaryId) => {
            const type = `${namespace}/${actionName}`

            function actionCreator(...args) {
                return {
                    type,
                    ...payloadCreator(...args)
                }
            }

            Object.defineProperties(actionCreator, {
                toString: {
                    enumerable: false,
                    value: () => type,
                },
                valueOf: {
                    enumerable: false,
                    value: () => type,
                }
            })

            return actionCreator
        }
    },
    reducerCreator: (actions, defaultState) => {
        return (state = defaultState, action) => {
            const {type} = action;
            if (actions[type]) {
                const newState = actions[type](state, action)

                if (reduxto.__config.strictInvariant) {
                    return JSON.parse(JSON.stringify(newState))
                }

                return newState
            }
        }
    }
}

const config = DEFAULT_CONFIG

function reduxto(namespace, defaultState, handlers = {}) {
    const reducerName = reduxto.__config.reducerName(namespace)
    const createAction = reduxto.__config.actionCreator(namespace)

    const actions = Object.keys(reduxto.__config.actions).reduce((acc, operation) => ({
        ...acc,
        [operation]: createAction(operation + reducerName)
    }), {})

    const defaultHandlers = reduxto.__config.actions

    const actionHandlers = {
        [actions.set]: defaultHandlers.set,
        [actions.put]: defaultHandlers.put,
        [actions.update]: defaultHandlers.update,
        [actions.remove]: defaultHandlers.remove,
        ...handlers,
    }

    const reducer = reduxto.__config.reducerCreator(actionHandlers, defaultState)

    return {
        reducer,
        actions,
    }
}

reduxto.__config = config;

reduxto.configure = (cfg) => {
    const newActions =  {
        ...reduxto.__config.actions,
        ...(cfg.actions || {}),
    }

    reduxto.__config = {
        ...reduxto.__config,
        ...cfg,
        actions: newActions
    }
}

reduxto.configure.default = DEFAULT_CONFIG

export default reduxto
