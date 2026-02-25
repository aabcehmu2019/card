import { _decorator, Component, Node, Prefab, resources, JsonAsset, instantiate, Input, UITransform, Button, Label, Color } from 'cc';
import { GameModel } from '../models/GameModel';
import { CardView } from '../views/CardView';
const { ccclass, property } = _decorator;

/**
 * 游戏主控制器
 * 
 * 功能：协调游戏数据模型（GameModel）与视图（CardView），处理用户输入（点击卡牌）、初始化游戏界面、响应按钮事件。
 * 使用场景：作为游戏场景的入口组件，挂载到场景根节点，负责启动整个游戏流程。
 */
@ccclass('GameController')
export class GameController extends Component {
    /** 卡牌预制体，用于动态实例化卡牌节点 */
    @property(Prefab)
    cardPrefab: Prefab = null;

    /** 主牌区节点，所有初始牌桌上的卡牌将放置在此节点下 */
    @property(Node)
    mainCardArea: Node = null;

    /** 备用牌区节点，未翻开的卡牌堆叠区域 */
    @property(Node)
    stockPile: Node = null;

    /** 堆牌区节点，已打出的卡牌放置区域 */
    @property(Node)
    discardPile: Node = null;

    /** 回退按钮，点击后可回退上一次卡牌移动操作 */
    @property(Button)
    undoButton: Button = null;

    /** 游戏数据模型实例，管理所有卡牌的状态 */
    private _model: GameModel = new GameModel();

    /** 卡牌视图映射表，键为卡牌ID，值为对应的 CardView 组件，用于快速查找和更新 */
    private _cardViewMap: Map<number, CardView> = new Map();

    /**
     * 加载游戏配置并初始化回退按钮
     */
    start() {
        this._loadConfig();
        this._initUndoButton();
    }

    /**
     * 加载游戏配置文件（stage.json）。从 resources/configs/stage 加载 JsonAsset，成功后解析数据并创建所有卡牌
     */
    private _loadConfig() {
        resources.load('configs/stage', JsonAsset, (err, res) => {
            if (err) { console.error(err); return; }
            this._model.loadData(res.json);
            this._createAllCards();
        });
    }

    /**
     * 创建所有区域的卡牌节点。遍历 'main'、'stock'、'discard' 三个区域，为每张卡牌创建对应的视图createCardNode节点
     */
    private _createAllCards() {
        const areas = ['main', 'stock', 'discard'];
        areas.forEach(area => {
            const cardsData = this._model.getCardsInArea(area);
            cardsData.forEach(data => {
                this._createCardNode(data);
            });
        });
    }

    /**
     * 为单张卡牌数据创建对应的节点并挂载 CardView 组件
     * @param data - 卡牌数据对象（包含 id, suit, face, area, position 等属性）
     */
    private _createCardNode(data: any) {
        const cardNode = instantiate(this.cardPrefab);
        let parent: Node;

        switch (data.area) {
            case 'main':
                parent = this.mainCardArea;
                break;
            case 'stock':
                parent = this.stockPile;
                const existingCards = this.stockPile.children;
                const idx = existingCards.length;
                data.position.x += idx * 100;
                break;
            case 'discard':
                parent = this.discardPile;
                break;
            default: return;
        }
        cardNode.setParent(parent);
        cardNode.setPosition(data.position.x, data.position.y);

        // 获取 CardView 组件
        const cardView = cardNode.getComponent(CardView);
        if (cardView) {
            cardView.cardId = data.id;
            cardView.updateDisplay(data.suit, data.face);
            this._cardViewMap.set(data.id, cardView);
        }

        // 添加点击事件
        cardNode.on(Input.EventType.TOUCH_END, this._onCardClick, this);
    }

    /**
     * 卡牌点击事件处理
     * 根据卡牌所在区域和匹配规则决定是否允许移动
     * @param event - 触摸事件对象，通过 event.currentTarget 获取点击的节点
     */
    private _onCardClick(event: any) {
        const cardNode = event.currentTarget as Node;
        const cardView = cardNode.getComponent(CardView);
        if (!cardView) return;
        const cardId = cardView.cardId;

        if (this._isCovered(cardNode)) {
            console.warn('当前卡牌被遮挡，无法移动');
            return;
        }

        const parent = cardNode.parent;
        if (parent === this.discardPile) {
            console.warn('卡牌已在堆牌区');
            return;
        }

        // 备用牌区的卡牌可直接移入discard区
        if (parent === this.stockPile) {
            this._moveCardToDiscard(cardId);
        }
        // main区的卡牌需要检查匹配规则
        else if (parent === this.mainCardArea) {
            if (this.isMatch(cardId)) {
                this._moveCardToDiscard(cardId);
            } else {
                console.warn('卡牌不匹配，不能移动');
            }
        }
    }

    /**
     * 将指定卡牌移动到discard区，新卡牌数据模型和视图位置
     * @param cardId - 要移动的卡牌ID
     */
    private _moveCardToDiscard(cardId: number) {
        const targetPos = { x: 0, y: 0 };
        const success = this._model.moveCard(cardId, 'discard', targetPos);
        if (success) {
            const cardView = this._cardViewMap.get(cardId);
            if (cardView) {
                cardView.node.removeFromParent();
                cardView.node.setParent(this.discardPile);
                cardView.node.setPosition(targetPos.x, targetPos.y);
            }
        }
    }

    /**
     * 通过检测当前节点在父节点子节点列表中的顺序以及矩形碰撞，判断指定卡牌是否被上方的其他卡牌遮挡
     * @param cardNode - 要检查的卡牌节点
     * @returns 如果被遮挡返回 true，否则返回 false
     */
    private _isCovered(cardNode: Node): boolean {
        const parent = cardNode.parent;
        if (!parent) return false;
        const children = parent.children;
        const currentIdx = children.indexOf(cardNode);
        if (currentIdx === -1) return false;

        const uiTransform = cardNode.getComponent(UITransform);
        if (!uiTransform) return false;
        const currentRect = uiTransform.getBoundingBoxToWorld();

        for (let i = currentIdx + 1; i < children.length; i++) {
            const upperNode = children[i];
            if (!upperNode.active) continue;
            const upperTransform = upperNode.getComponent(UITransform);
            if (!upperTransform) continue;
            const upperRect = upperTransform.getBoundingBoxToWorld();
            if (currentRect.intersects(upperRect)) {
                console.log('当前卡牌被遮挡，无法移动');
                return true;
            }
        }
        return false;
    }

    /**
     * 检查指定卡牌是否与弃牌堆最上面的卡牌点数相邻（绝对值差为1）
     * @param cardId - 要检查的卡牌ID
     * @returns 若满足匹配规则返回 true，否则 false（卡牌不存在或discard区域为空也返回 false）
     */
    public isMatch(cardId: number): boolean {
        const discardChildren = this.discardPile.children;
        if (discardChildren.length === 0) {
            console.warn('堆牌区无卡牌');
            return false;
        }
        const topDiscardNode = discardChildren[discardChildren.length - 1];
        const topNode = topDiscardNode.getComponent(CardView);
        const topFace = this._model.getCardById(topNode.cardId).face;
    
        const currentCard = this._model.getCardById(cardId);
        if (!currentCard) return false;

        const MatchFlag = Math.abs(currentCard.face - topFace) === 1;
        return MatchFlag;
        
    }

    /**
     * 初始化回退按钮，并绑定点击事件
     */
    private _initUndoButton() {
        if (!this.undoButton) return;
        this.undoButton.node.on(Button.EventType.CLICK, this._onUndo, this);
    }

    /**
     * 回退按钮点击事件处理，从模型中撤销上一次移动，并更新对应卡牌的视图位置
     */
    private _onUndo() {
        const last = this._model.undo();
        if (last) {
            const cardView = this._cardViewMap.get(last.cardId);
            if (cardView) {
                const parent = this._getNodeForArea(last.oldArea);
                if (parent) {
                    cardView.node.removeFromParent();
                    cardView.node.setParent(parent);
                    cardView.node.setPosition(last.oldPos.x, last.oldPos.y);
                }
            }
        }
    }

    /**
     * 根据区域名称获取对应的节点对象
     * @param area - 区域名称（'main', 'stock', 'discard'）
     * @returns 对应的节点，如果区域不存在则返回 null
     */
    private _getNodeForArea(area: string): Node | null {
        switch (area) {
            case 'main': return this.mainCardArea;
            case 'stock': return this.stockPile;
            case 'discard': return this.discardPile;
            default: return null;
        }
    }
}