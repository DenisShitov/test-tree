// Есть массив объектов, которые имеют поля id и parent,
// через которые их можно связать в дерево и некоторые произвольные поля.
// id может быть как числом, так и строкой. Порядок id не гарантируется,
// изначально отсутствует какой либо принцип сортировки.
// Поле type не влияет ни на что,
// просто отображает возможность наличия какой-то полезной нагрузки в айтемах.

interface Item {
    id: string|number
    parent: string|number
    type: any
}

class TreeStore {

    cloneItems: Item[]
    items: any[]
    tree: any
    map: Map<string|number, Item>

    constructor(items) {
        this.cloneItems = JSON.parse(JSON.stringify(items))
        this.items = items
        this.map = new Map(items.map(el => [el.id, structuredClone(el)]))
        this.tree = this.getTreeFromArray([...items.map(el => structuredClone(el))])
    }

    private getTreeFromArray(array) {
        const root = array.filter(el => el.parent === 'root')

        const setChildren = (items) => {
            for (const item of items) {

                if(!item.hasOwnProperty('children')) item.children = []

                if (this.items.find(n => n.parent === item.id)) {
                    item.children.push(...this.items.filter(i => i.parent === item.id))
                    setChildren(item.children)
                }
            }
        }

        setChildren(root)

        return root
    }

    private findChildrenInTreeById(id: any) {

        const findLoop = (items) => {
            for (const item of items) {
                if (item.id === id) {
                    return item.children
                } else if (item.children.length) {
                    return findLoop(item.children)
                } else {
                    return []
                }
            }
        }

        return findLoop(this.tree)
    }

    /**
     * Должен возвращать изначальный массив элементов.
     */
    getAll(): Array<Item> {
        return this.cloneItems
    }

    /**
     * Принимает id элемента и возвращает сам объект элемента;
     *
     * @param {string | number} id
     */
    getItem(id): Item {
        return this.map.get(id)
    }

    /**
     * Принимает id элемента и возвращает массив элементов, являющихся дочерними для того элемента,
     * чей id получен в аргументе. Если у элемента нет дочерних, то должен возвращаться пустой массив;
     *
     * @param {string | number} id
     */
    getChildren(id) {
        if(!this.map.has(id)) return null

        const result = this.findChildrenInTreeById(id)

        return result.length ? result.map(el => this.map.get(el.id)) : []
    }

    /**
     * Принимает id элемента и возвращает массив элементов, являющихся прямыми дочерними элементами того,
     * чей id получен в аргументе + если у них в свою очередь есть еще дочерние элементы, они все тоже будут включены в результат,
     * и так до самого глубокого уровня.
     *
     * @param {string | number} id
     */
    getAllChildren(id) {
        const res = this.findChildrenInTreeById(id)
        const array = []

        const addChildren = (items) => {
            for (const item of items) {
                array.push(this.map.get(item.id))
                if(item.children.length) addChildren(item.children)
            }
        }

        addChildren(res)

        return array
    }

    /**
     * Принимает id элемента и возвращает массив из цепочки родительских элементов,
     * начиная от самого элемента, чей id был передан в аргументе и до корневого элемента,
     * т.е. должен получиться путь элемента наверх дерева через цепочку родителей к корню дерева.
     * в результате getAllParents ПОРЯДОК ЭЛЕМЕНТОВ ВАЖЕН!
     *
     * @param {string | number} id
     */
    getAllParents(id) {
        const array: Item[] = []
        const item: Item = this.map.get(id)
        const items = new Map (this.map)

        array.push(item)

        const getParent = (n: string|number) => {
            for (let value of items.values()) {
                if(value.id === n) {
                    if (n === 'root') {
                        array.push(this.cloneItems.find(i => i.parent === 'root'))
                        return true
                    }
                    array.push(value)
                    items.delete(value.id)
                    getParent(value.parent)
                }
            }
        }

        getParent(item.parent)

        return array
    }
}

const items = [
    { id: 1, parent: 'root' },
    { id: 2, parent: 1, type: 'test' },
    { id: 3, parent: 1, type: 'test' },

    { id: 4, parent: 2, type: 'test' },
    { id: 5, parent: 2, type: 'test' },
    { id: 6, parent: 2, type: 'test' },

    { id: 7, parent: 4, type: null },
    { id: 8, parent: 4, type: null },
];

const ts = new TreeStore(items);

console.log('getAll() -> ', ts.getAll())
console.log('getItem() -> ', ts.getItem(7))
console.log('getChildren() -> ', ts.getChildren(8))
console.log('getAllChildren() -> ', ts.getAllChildren(2))
console.log('getAllParents() -> ', ts.getAllParents(7))