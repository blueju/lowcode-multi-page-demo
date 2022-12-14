import { PageSchema, TransformStage } from '@alilc/lowcode-types';
import { SelectInfo } from 'rc-menu/lib/interface';
import { useEffect, useState } from 'react';
import { project } from '@alilc/lowcode-engine';
import {
  Row,
  Col,
  Form,
  Menu,
  Input,
  Modal,
  Space,
  Button,
  Upload,
  Divider,
  message
} from 'antd';
import { UploadChangeParam } from 'antd/lib/upload'
import { FileAddOutlined, ExportOutlined, ImportOutlined, DeleteTwoTone } from '@ant-design/icons'

let defaultPageSchema: PageSchema = require('../schema.json')
/** 接口请求域名端口前缀，根据服务实际情况调整 */
const baseUrl = 'http://localhost:3010'

/** 新建表单字段值 */
interface ICreateFormFieldsValue {
  fileName: string
}

export default () => {
  // 新建表单实例
  const [createPageForm] = Form.useForm();
  // 页面列表
  const [pages, setPages] = useState<PageSchema[]>([]);
  // 当前页面
  const [currentPage, setCurrentPage] = useState('');
  // 新建页面弹窗是否可见
  const [createPageModalVisible, setPageModalVisible] = useState(false);

  useEffect(() => {
    getPages()
      .then((pages: PageSchema[]) => {
        setCurrentPage(pages[0].fileName)
        project.currentDocument && project.removeDocument(project.currentDocument);
        project.openDocument(pages[0])
      })
  }, []);

  /** 开启/关闭新建页面弹窗 */
  const openCreatePageModal = () => setPageModalVisible(true);
  const closeCreatePageModal = () => setPageModalVisible(false);

  /**
   * 获取所有页面
   */
  const getPages = () => {
    return fetch(`${baseUrl}/pages`, { method: 'GET' })
      .then((res) => res.json())
      .then((resJson: {
        code: 0,
        data: PageSchema[]
      }) => {
        setPages(resJson.data);
        return resJson.data
      })
  };

  /**
   * 通过页面文件名删除指定页面
   */
  const deletePageByFileName = (fileName: string) => {
    fetch(`${baseUrl}/page/${fileName}`, { method: 'DELETE' })
      .then(res => res.json())
      .then((resJson: {
        code: 0 | -1,
        msg: string
      }) => {
        if (resJson.code === 0) {
          message.success(resJson.msg)
          getPages()
            .then((pages: PageSchema[]) => {
              setCurrentPage(pages[0].fileName)
              project.openDocument(pages[0])
            })
        } else {
          message.error(resJson.msg)
        }
      })
  };

  /** 新建页面 */
  const createPage = (values: ICreateFormFieldsValue) => {
    const { fileName } = values
    defaultPageSchema.fileName = fileName
    fetch(`${baseUrl}/page/${fileName}`, {
      method: 'POST',
      body: JSON.stringify({ pageSchema: defaultPageSchema }),
      headers: { 'content-type': 'application/json;charset=UTF-8' }
    })
      .then((res) => res.json())
      .then((resJson: { code: 0 | -1, msg: string }) => {
        if (resJson.code === 0) {
          message.success(resJson.msg)
          getPages();
          createPageForm.resetFields();
          setPageModalVisible(false);
        } else {
          message.error(resJson.msg)
        }
      })
  };

  /** 导出 */
  const exportAllPageSchema = () => {
    const blob = new window.Blob([JSON.stringify(pages)], {
      type: 'application/json;charset=UTF-8',
    });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLinkDOM = document.createElement('a');
    downloadLinkDOM.href = downloadUrl;
    downloadLinkDOM.download = 'schema.json';
    downloadLinkDOM.click();
    URL.revokeObjectURL(downloadUrl);
  };

  /** 导入 */
  const importAllPageSchema = (info: UploadChangeParam) => {
    if (info.file.status === 'done') {
      const file = info.file.originFileObj;
      const fileReader = new FileReader();
      fileReader.readAsText(file!);
      fileReader.onload = () => {
        // 具体逻辑待补充
        // const allPageSchema = JSON.parse(fileReader.result as string);
        // let pageId;
        // allPageSchema.forEach((item: string[], index: number) => {
        //   if (index === 0) pageId = item[0].split(':')[0];
        //   localStorage.setItem(item[0], item[1]);
        // });
        // message.success('导入成功');
        // getPages();
        // setCurrentPage(pageId);
        // saveSchema();
      };
    }
  };

  /** 保存页面 */
  const savePage = () => {
    const pageSchema = project.currentDocument?.exportSchema(TransformStage.Save)
    return fetch(`${baseUrl}/page/${pageSchema?.fileName}`, {
      method: 'PUT',
      body: JSON.stringify({ pageSchema }),
      headers: { 'content-type': 'application/json;charset=UTF-8' }
    })
      .then((res) => res.json())
      .then((resJson: { code: 0 | -1, msg: string }) => {
        if (resJson.code === 0) {
          message.success('上一页面已自动保存')
        } else {
          message.error(resJson.msg)
          return Promise.reject()
        }
      })
  }

  const handleSelect = async ({ selectedKeys }: SelectInfo) => {
    const prevCurrentPage = currentPage
    const fileName = selectedKeys[0];
    setCurrentPage(fileName);
    // 在线保存
    savePage()
      .then(() => {
        // 使用低代码编辑的页面往往都挺复杂，确保在线保存成功后再切其他页面
        const schema = pages.find(item => item.fileName === fileName)!;
        project.currentDocument && project.removeDocument(project.currentDocument);
        project.openDocument(schema);
        // 为了更快地将所点击页面的 schema 渲染到画布上，重新获取所有页面的数据这一操作可以晚点再做
        getPages()
      })
      .catch(() => {
        // 如果在线保存失败，页面菜单高亮项切回前一个页面
        setCurrentPage(prevCurrentPage)
      })
  };

  return (
    <>
      <Row gutter={8} style={{ paddingLeft: 14 }}>
        <Col>
          <Button
            size="small"
            icon={<FileAddOutlined />}
            onClick={openCreatePageModal}
          >
            新建
          </Button>
        </Col>
        <Col>
          <Button
            size="small"
            icon={<ExportOutlined />}
            onClick={exportAllPageSchema}

          >
            导出
          </Button>
        </Col>
        <Col>
          <Upload
            showUploadList={false}
            onChange={importAllPageSchema}
          >
            <Button
              size="small"
              icon={<ImportOutlined />}
              disabled
            >
              导入
            </Button>
          </Upload>
        </Col>
      </Row>
      <Divider style={{ marginTop: 14, marginBottom: 0 }} />
      <Menu
        mode="inline"
        onSelect={handleSelect}
        selectedKeys={[currentPage]}
      >
        {pages.length
          ? pages.map(page => (
            <Menu.Item key={page.fileName} style={{ margin: '0 0' }}>
              <Row justify='space-between' align='middle'>
                <Col>{page.fileName}</Col>
                <Col>
                  <DeleteTwoTone onClick={() => deletePageByFileName(page.fileName)} />
                </Col>
              </Row>
            </Menu.Item>
          ))
          : null}
      </Menu>

      <Modal
        title="新建页面"
        visible={createPageModalVisible}
        footer={null}
        onCancel={closeCreatePageModal}
      >
        <Form
          form={createPageForm}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          onFinish={createPage}
          initialValues={{ fileName: '' }}
        >
          <Form.Item
            name="fileName"
            label="文件名"
            required
          >
            <Input />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6 }}>
            <Space size='small'>
              <Button
                type="primary"
                htmlType="submit"
              >
                创建
              </Button>
              <Button
                htmlType="reset"
              >
                重置
              </Button>
            </Space>

          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};