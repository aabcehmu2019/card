import { _decorator, Component, Node, Sprite, SpriteFrame, resources } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 卡牌渲染组件
 * 
 * 功能：负责单张卡牌的视觉显示，包括花色、牌面图案和数字标记。
 * 使用场景：挂载到卡牌节点上，通过 updateDisplay 方法更新显示内容。
 */
@ccclass('CardView')
export class CardView extends Component {
    /** 卡牌的唯一标识符，用于关联对应的数据模型 */
    public cardId: number = -1;

    /** 花色图案的 Sprite 组件，对应子节点 "CardSuit"，用于显示卡牌的花色符号（黑桃、红心、梅花、方块）*/
    private _suitSprite: Sprite | null = null;

    /** 大牌面图案的 Sprite 组件，对应子节点 "CardFace"，用于显示卡牌的大号牌面数字/字母 */
    private _faceSprite: Sprite | null = null;

    /** 小数字标记的 Sprite 组件，对应子节点 "CardNum"，用于显示牌角的小号数字，便于叠牌时识别牌面 */
    private _numSprite: Sprite | null = null;

    /** 花色名称映射表，索引0-3分别对应：梅花(club)、方块(diamond)、红心(heart)、黑桃(spade) */
    private static readonly kSuitNames: string[] = ['club', 'diamond', 'heart', 'spade'];

    /** 花色名称映射表，索引0-3分别对应：梅花(club)、方块(diamond)、红心(heart)、黑桃(spade) */
    private static readonly kFaceNumbers: string[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    /**
     * 查找并获取卡牌各视觉元素对应的子节点 Sprite 组件，以便后续更新显示。
     */
    onLoad() {
        // 查找花色子节点并获取 Sprite 组件
        const suitNode = this.node.getChildByName('CardSuit');
        if (suitNode) this._suitSprite = suitNode.getComponent(Sprite);

        // 查找大牌面子节点并获取 Sprite 组件
        const faceNode = this.node.getChildByName('CardFace');
        if (faceNode) this._faceSprite = faceNode.getComponent(Sprite);

        // 查找小数字子节点并获取 Sprite 组件
        const numNode = this.node.getChildByName('CardNum');
        if (numNode) this._numSprite = numNode.getComponent(Sprite);

        // 检查所有必需组件是否都已成功获取，若缺失则发出警告
        if (!this._suitSprite || !this._faceSprite || !this._numSprite) {
            console.warn('CardView: 缺少必要的 Sprite 组件，请检查节点结构');
        }
    }

    /**
     * 更新卡牌显示
     * @param suit 花色索引（0-3，对应俱乐部、方块、红心、黑桃）
     * @param face 牌面点数索引（0-12，对应 A 到 K）
     */
    public updateDisplay(suit: number, face: number) {
        if (!this._suitSprite || !this._faceSprite || !this._numSprite) {
            console.warn('CardView: Sprite 组件未就绪，无法更新显示');
            return;
        }

        // 设置花色图案
        const suitPath = `suits/${CardView.kSuitNames[suit]}/spriteFrame`;
        this._loadSprite(suitPath, this._suitSprite);

        // 根据花色决定数字颜色（红/黑）
        const color = (suit === 1 || suit === 2) ? 'red' : 'black';
        const faceStr = CardView.kFaceNumbers[face];

        // 设置大牌面图案
        const bigFacePath = `face/big_${color}_${faceStr}/spriteFrame`;
        this._loadSprite(bigFacePath, this._faceSprite);

        // 设置小数字图案
        const smallNumPath = `face/small_${color}_${faceStr}/spriteFrame`;
        this._loadSprite(smallNumPath, this._numSprite);
    }

    /**
     * 加载指定路径的 SpriteFrame 并赋值给目标 Sprite 组件
     * @param path 资源路径（相对于 resources 目录）
     * @param targetSprite 目标 Sprite 组件
     * @private
     */
    private _loadSprite(path: string, targetSprite: Sprite): void {
        resources.load(path, SpriteFrame, (err, sf) => {
            if (err) {
                console.error(`加载图片失败：${path}`, err);
                return;
            }
            targetSprite.spriteFrame = sf;
        });
    }
}