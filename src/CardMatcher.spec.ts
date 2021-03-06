import { Card, Attribute } from './Card'
import { Skill, SkillType } from './Skill'
import { CardMatcher } from './CardMatcher'

import { expect } from 'chai'
import 'mocha'

describe('CardMatcher', () => {
    describe('match()', () => {
        it('should return whether skill type match', () => {
            const matcher = new CardMatcher(SkillType.ATTACK, null, null)

            const cardBoost = new Card()
            cardBoost.skill = new Skill(SkillType.BOOST)
            expect(matcher.match(cardBoost)).to.be.false

            const cardAttack = new Card()
            cardAttack.skill = new Skill(SkillType.ATTACK)
            expect(matcher.match(cardAttack)).to.be.true
        })
        it('should return whether attribute match', () => {
            const matcher = new CardMatcher(null, Attribute.FIRE, null)

            const cardLeaf = new Card()
            cardLeaf.attribute = Attribute.LEAF
            expect(matcher.match(cardLeaf)).to.be.false

            const cardFire = new Card()
            cardFire.attribute = Attribute.FIRE
            expect(matcher.match(cardFire)).to.be.true
        })
        it('should return whether character name match', () => {
            // this matcher will match only Riku
            const matcher = new CardMatcher(null, null, ['結城 莉玖'])
            // this matcher will match Riku or Tsubaki
            const matcher2 = new CardMatcher(null, null, ['結城 莉玖', '藍原 椿'])

            const cardTsubaki = new Card()
            cardTsubaki.characterName = '藍原 椿'
            expect(matcher.match(cardTsubaki)).to.be.false
            expect(matcher2.match(cardTsubaki)).to.be.true

            const cardRiku = new Card()
            cardRiku.characterName = '結城 莉玖'
            expect(matcher.match(cardRiku)).to.be.true
            expect(matcher2.match(cardRiku)).to.be.true

            const cardHaruna = new Card()
            cardHaruna.characterName = '桜井 春菜'
            expect(matcher.match(cardHaruna)).to.be.false
            expect(matcher2.match(cardHaruna)).to.be.false
        })
        it('should return true only when everything match', () => {
            const matcher = new CardMatcher(SkillType.ATTACK, Attribute.FIRE, ['結城 莉玖'])

            const card = new Card()
            card.skill = new Skill(SkillType.BOOST)
            card.attribute = Attribute.LEAF
            card.characterName = '藍原 椿'

            // Nothing match
            expect(matcher.match(card)).to.be.false

            card.characterName = '結城 莉玖'
            // Only name match
            expect(matcher.match(card)).to.be.false

            card.attribute = Attribute.FIRE
            // Name and attribute match, but not skill
            expect(matcher.match(card)).to.be.false

            card.skill = new Skill(SkillType.ATTACK)
            // Everything match
            expect(matcher.match(card)).to.be.true
        })
    })
})
