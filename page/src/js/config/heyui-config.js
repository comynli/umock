const heyuiConfig = () => {
  HeyUI.initDict({
    Private: {
      1: '私有',
      2: '公共',
    }
  });

  // HeyUI.config("autocomplete.configs", {
  //   simple: {
  //     loadData,
  //     keyName: 'id',
  //     titleName: 'name',
  //     minWord: 1
  //   }
  // });

  // HeyUI.config("tree.configs", {
  //   simple: {
  //     keyName: 'id',
  //     parentName: 'parent',
  //     titleName: 'title',
  //     dataMode: 'list',
  //     datas: list
  //   }
  // });
};

export default heyuiConfig;
