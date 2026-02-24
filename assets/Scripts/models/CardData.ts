/**
 * 卡牌数据模型
 * 
 * 功能：定义单张卡牌的静态数据，包括唯一标识、牌面点数、花色、所属区域和界面位置。
 * 使用场景：在游戏初始化时创建，用于表示每一张卡牌的核心属性，并在游戏逻辑中传递。
 */
export class CardData {
    /** 卡牌的唯一标识符，通常用于区分不同卡牌实例 */
    public id: number;

    /** 牌面点数，对应扑克牌的 A 到 K */
    public face: number;

    /** 花色编号，0=梅花、1=方块、2=红心、3=黑桃*/
    public suit: number;

    /** 卡牌当前所在的区域标识，包括主牌区'main'，备用牌区'stock'，堆牌区'discard'*/
    public area: string;

    /** 卡牌在游戏界面上的二维坐标，用于渲染和交互 */
    public position: { x: number; y: number };

    /**
     * 创建一张卡牌数据实例
     * @param id    - 卡牌唯一标识
     * @param face  - 牌面点数
     * @param suit  - 花色编号
     * @param area  - 所属区域
     * @param pos   - 界面坐标对象，包含 x 和 y 属性
     */
    constructor(id: number, face: number, suit: number, area: string, pos: { x: number; y: number }) {
        this.id = id;
        this.face = face;
        this.suit = suit;
        this.area = area;
        this.position = pos;
    }
}