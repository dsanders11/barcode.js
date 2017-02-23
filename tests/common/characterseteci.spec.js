// (c) 2013 Manuel Braun (mb@w69b.com)
define(['chai'], function(chai) {
  var expect = chai.expect;
  var CharacterSetECI = w69b.common.CharacterSetECI;

  describe('CharacterSetECI', function() {

    it('should return value by name', function() {
      expect(CharacterSetECI.getCharacterSetECIByName('UTF-8').getValue()).to.equal(26);
      expect(CharacterSetECI.getCharacterSetECIByName('UTF-8').getValue()).to.equal(26);
      expect(CharacterSetECI.getCharacterSetECIByName('Shift_JIS').getValue()).to.equal(20);
    });

    it('should return name by value', function() {
      expect(CharacterSetECI.getCharacterSetECIByValue(26).name).to.equal('UTF8');
      expect(CharacterSetECI.getCharacterSetECIByValue(20).name).to.equal('SJIS');
      expect(CharacterSetECI.getCharacterSetECIByValue(0).name).to.equal('Cp437');
      expect(CharacterSetECI.getCharacterSetECIByValue(2).name).to.equal('Cp437');
    });
  });
});
