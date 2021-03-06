import { Card, Attribute, Deck } from './Card'
import { CardMatcher } from './CardMatcher'
import { Skill, SkillType } from './Skill'

import { expect } from 'chai'
import 'mocha'

describe('Skill', () => {
    describe('calculateSelfIncreasePercent()', () => {
        it('should return 0 if skill is boost type', () => {
            const skill = new Skill(SkillType.BOOST, 10)
            expect(skill.calculateSelfIncreasePercent(true, null)).to.equal(0)
        })
        it('should return percentage when there is no condition', () => {
            const skill = new Skill(SkillType.GUARD, 5)
            expect(skill.calculateSelfIncreasePercent(false, null)).to.equal(5)
        })
        it('should return 0 if skill is only active during boss phase, while not in boss phase', () => {
            const skill = new Skill(SkillType.ATTACK, 15, true)
            expect(skill.calculateSelfIncreasePercent(false, null)).to.equal(0)
            expect(skill.calculateSelfIncreasePercent(true, null)).to.equal(15)
        })
        it('should return higher value when skill is in choukaika state', () => {
            const skill = new Skill(SkillType.ASSIST, 5)
            // Without choukaika
            expect(skill.calculateSelfIncreasePercent(false, null)).to.equal(5)
            // With choukaika
            skill.choukaika = true
            expect(skill.calculateSelfIncreasePercent(false, null)).to.equal(7)
        })
        it('should return higher value when skill is in choukaika state, with percentage choukaika', () => {
            const skill = new Skill(SkillType.ATTACK, 5)
            // Set special choukaika percentage of 25
            skill.percentageChoukaika = 25
            // Without choukaika
            expect(skill.calculateSelfIncreasePercent(false, null)).to.equal(5)
            // With choukaika
            skill.choukaika = true
            expect(skill.calculateSelfIncreasePercent(false, null)).to.equal(25)
        })
        it('should return percentage multiplied by the number of card matching the conditon', () => {
            const skill = new Skill(SkillType.ATTACK, 7, true)
            skill.condition = new CardMatcher(null, null, ['結城 莉玖'])

            // No deck specified, condition is ignored, return percentage
            expect(skill.calculateSelfIncreasePercent(true, null)).to.equal(7)

            const card1 = new Card()
            card1.characterName = '結城 莉玖'
            const card2 = new Card()
            card2.characterName = '藍原 椿結'
            const card3 = new Card()
            card3.characterName = '桜井 春菜'
            const deck = new Deck(card1, card2, card3)

            // Only one card in deck match condiiton, should return percentage
            expect(skill.calculateSelfIncreasePercent(true, deck)).to.equal(7)

            card2.characterName = '結城 莉玖'
            card3.characterName = '結城 莉玖'

            // All cards in deck match condiiton, should return 3 times percentage
            expect(skill.calculateSelfIncreasePercent(true, deck)).to.equal(7 * 3)

        })
    })
    describe('calculateBoostPercent()', () => {
        it('should return 0 if skill is not boost type', () => {
            const skill = new Skill(SkillType.ASSIST, 5)

            expect(skill.calculateBoostPercent(true, new Card())).to.equal(0)
        })
        it('should return percentage if condition match card', () => {
            const skill = new Skill(SkillType.BOOST, 14)
            skill.condition = new CardMatcher(SkillType.ATTACK, null, null)

            const card = new Card()
            card.skill = new Skill(SkillType.GUARD)

            // card does not match condition, should return 0
            expect(skill.calculateBoostPercent(true, card)).to.equal(0)

            card.skill = new Skill(SkillType.ATTACK)

            // Card match condition, should return percent
            expect(skill.calculateBoostPercent(true, card)).to.equal(14)
        })
        it('should return higher value when in choukaika state', () => {
            const skill = new Skill(SkillType.BOOST, 14)
            skill.condition = new CardMatcher(SkillType.ATTACK, null, null)

            const card = new Card()
            card.skill = new Skill(SkillType.ATTACK)

            // Not Choukaika should return base percentage
            expect(skill.calculateBoostPercent(true, card)).to.equal(14)
            // Choukaika should return base percentage + 2
            skill.choukaika = true
            expect(skill.calculateBoostPercent(true, card)).to.equal(16)
        })
        it('should return 0 if skill is only active during boss phase, while not in boss phase', () => {
            const skill = new Skill(SkillType.BOOST, 14, true)
            skill.condition = new CardMatcher(SkillType.ATTACK, null, null)

            const card = new Card()
            card.skill = new Skill(SkillType.ATTACK)

            expect(skill.calculateBoostPercent(false, card)).to.equal(0)
            expect(skill.calculateBoostPercent(true, card)).to.equal(14)
        })
    })
    describe('fromJson()', () => {
        it('should correctly parse and return attack skill', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: 'アタック +15',
                details: '自身の攻撃力15％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].type).to.equal(SkillType.ATTACK)
            expect(skills[0].percentageBase).to.equal(15)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.be.undefined
        })
        it('should correctly parse and return attack boss skill', () => {

            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: 'ボスアタック +5',
                details: 'バトル後半で、自身の攻撃力5％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(5)
            expect(skills[0].boss).to.be.true
            expect(skills[0].condition).to.be.undefined
        })
        it('should correctly parse and return attack skill with condition', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: 'ボス莉玖フュージョン +7',
                details: 'バトル後半で、【結城 莉玖】のカード1枚につき、\n自身の攻撃力7％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(7)
            expect(skills[0].boss).to.be.true
            expect(skills[0].condition).to.deep.equal(new CardMatcher(null, null, ['結城 莉玖']))
        })
        it('should correctly parse and return attack skill with 2 characters condition', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: '春菜＆彩華フュージョン +3',
                details: '【桜井 春菜】か【早乙女 彩華】のカード1枚につき、\n自身の攻撃力3％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(3)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(null, null, ['桜井 春菜', '早乙女 彩華']))
        })
        it('should correctly parse and return attack no damage skill', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: 'ノーダメアタック +14',
                details: 'ダメージカウント0の時、自身の攻撃14％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(14)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.be.undefined
        })
        it('should correctly parse and return attack mantan skill', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: 'まんたんアタック +11',
                details: 'ライフ100％時、自身の攻撃力11％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(11)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.be.undefined
        })
        it('should correctly parse and return attack danger skill', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: 'アタック +20（危）',
                details: '自身の攻撃力20％アップ\n被弾時のダメージが2倍になる',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(20)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.be.undefined
        })
        it('should correctly parse and return attack low miss skill', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: 'ローミスアタック +10',
                details: 'MISS数10以下の時、自身の攻撃力10％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(10)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.be.undefined
        })
        it('should correctly parse and return attack skill with secondary skill', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: 'ボスアタック +14（ノーダメボスアタック +3）',
                details: 'バトル後半で、自身の攻撃力14％アップ\nダメージカウント0の時、追加で自身の攻撃力3％アップ',
            })

            expect(skills).to.have.lengthOf(2)
            expect(skills[0].percentageBase).to.equal(14)
            expect(skills[0].boss).to.be.true
            expect(skills[0].condition).to.be.undefined
            expect(skills[1].percentageBase).to.equal(3)
            expect(skills[1].boss).to.be.true
            expect(skills[1].condition).to.be.undefined
        })
        it('should correctly parse and return fusion skill with secondary skill', () => {
            const skills = Skill.fromJson({
                type: 'ATTACK',
                name: '小星フュージョン +5（ボスアタック +2）',
                details: '【井之原 小星】のカード1枚につき、自身の攻撃力5％アップ\nバトル後半で自身の攻撃力2％アップ',
            })

            expect(skills).to.have.lengthOf(2)
            expect(skills[0].percentageBase).to.equal(5)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(null, null, ['井之原 小星']))
            expect(skills[1].percentageBase).to.equal(2)
            expect(skills[1].boss).to.be.true
            expect(skills[1].condition).to.be.undefined
        })
        it('should correctly parse and return guard skill', () => {
            const skills = Skill.fromJson({
                type: 'GUARD',
                name: 'リーフガード +20',
                details: '属性【LEAF】からのダメージ20％軽減\n自身の攻撃力3％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].type).to.equal(SkillType.GUARD)
            expect(skills[0].percentageBase).to.equal(3)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.be.undefined
        })
        it('should correctly parse and return assist skill', () => {
            const skills = Skill.fromJson({
                type: 'ASSIST',
                name: 'SIDE-LRアシスト +5',
                details: 'ノーツ【SIDE】を自動で攻撃する\n自身の攻撃力5％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].type).to.equal(SkillType.ASSIST)
            expect(skills[0].percentageBase).to.equal(5)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.be.undefined
        })
        it('should correctly parse and return boost skill', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: 'ブースト +5',
                details: '【ATTACK】の攻撃力5％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].type).to.equal(SkillType.BOOST)
            expect(skills[0].percentageBase).to.equal(5)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(SkillType.ATTACK, null, null))
        })
        it('should correctly parse and return boost skill with attribute', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: 'ファイアブースト +10',
                details: '属性【FIRE】かつ【ATTACK】の攻撃力10％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(10)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(SkillType.ATTACK, Attribute.FIRE, null))
        })
        it('should correctly parse and return boost boss skill with attribute', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: 'ボスアクアブースト +17',
                details: 'バトル後半で、\n属性【AQUA】かつ【ATTACK】の攻撃力17％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(17)
            expect(skills[0].boss).to.be.true
            expect(skills[0].condition).to.deep.equal(new CardMatcher(SkillType.ATTACK, Attribute.AQUA, null))
        })
        it('should correctly parse and return boost skill with character', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: '美海ブースト +15',
                details: '【日向 美海】かつ【ATTACK】の攻撃力15％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(15)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(SkillType.ATTACK, null, ['日向 美海']))
        })
        it('should correctly parse and return boost skill with character but not skill type', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: 'ボス茜ブースト +15',
                details: 'バトル後半で、【逢坂 茜】の攻撃力15％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(15)
            expect(skills[0].boss).to.be.true
            expect(skills[0].condition).to.deep.equal(new CardMatcher(null, null, ['逢坂 茜']))
        })
        it('should correctly parse and return boost skill with 2 characters', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: '柚子＆葵ブースト +5',
                details: '【藤沢 柚子】と【三角 葵】の攻撃力5％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(5)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(null, null, ['藤沢 柚子', '三角 葵']))
        })
        it('should correctly parse and return boost skill no damage', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: 'ノーダメブースト +14',
                details: 'ダメージカウント0の時、【ATTACK】の攻撃14％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(14)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(SkillType.ATTACK, null, null))
        })
        it('should correctly parse and return boost skill mantan', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: 'まんたんブースト +12',
                details: 'ライフ100％時、【ATTACK】の攻撃12％アップ',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(12)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(SkillType.ATTACK, null, null))
        })
        it('should correctly parse and return boost skill danger', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: 'ブースト +12（危）',
                details: '【ATTACK】の攻撃力12％アップ\n被弾時のダメージが2倍になる',
            })

            expect(skills).to.have.lengthOf(1)
            expect(skills[0].percentageBase).to.equal(12)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(SkillType.ATTACK, null, null))
        })
        it('should correctly parse and return boost skill with secondary attack skill', () => {
            const skills = Skill.fromJson({
                type: 'BOOST',
                name: 'アクアブースト +10（アタック +3）',
                details: '属性【AQUA】かつ【ATTACK】の攻撃力10％アップ\n自身の攻撃力3％アップ'
            })

            expect(skills).to.have.lengthOf(2)
            // Main boost skill
            expect(skills[0].type).to.equal(SkillType.BOOST)
            expect(skills[0].percentageBase).to.equal(10)
            expect(skills[0].boss).to.be.false
            expect(skills[0].condition).to.deep.equal(new CardMatcher(SkillType.ATTACK, Attribute.AQUA, null))
            // Secondary attack skill
            expect(skills[1].type).to.equal(SkillType.ATTACK)
            expect(skills[1].percentageBase).to.equal(3)
            expect(skills[1].boss).to.be.false
            expect(skills[1].condition).to.be.undefined
        })
        it('should throw an error when skill details is not valid', () => {
            expect(Skill.fromJson.bind(Skill, {
                type: 'BOOST',
                name: 'invalid name',
                details: 'invalid details',
            })).to.throw('Could not parse card skill: invalid details')
        })
        it('should throw an error when skill type is not valid', () => {
            expect(Skill.fromJson.bind(Skill, {
                type: 'INVALIDTYPE',
                name: 'まんたんブースト +12',
                details: 'ライフ100％時、【ATTACK】の攻撃12％アップ',
            })).to.throw('Invalid type: INVALIDTYPE')
        })
    })
})
