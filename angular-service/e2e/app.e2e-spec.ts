import { AngularServicePage } from './app.po';

describe('angular-service App', function() {
  let page: AngularServicePage;

  beforeEach(() => {
    page = new AngularServicePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
