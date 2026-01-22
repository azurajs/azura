/**
 * SWAGGER FÁCIL - TypeScript com Decorators
 * Use o novo @Swagger decorator - tudo em um só lugar! 🎉
 */

import { AzuraClient } from '../../../package/azurajs/src/infra/Server';
import { setupSwaggerWithControllers, Swagger } from '../../../package/azurajs/src/swagger';
import { Controller, Get, Post } from '../../../package/azurajs/src/decorators';

@Controller('/binary')
class BinaryController {
  @Get('/encode')
  @Swagger({
    summary: 'Codifica um texto em binário',
    description: 'Retorna o texto codificado em binário via query parameter.',
    tags: ['code-binary'],
    security: [],
    parameters: [
      {
        name: 'q',
        in: 'query',
        description: 'O texto a ser codificado.',
        required: true,
        schema: { type: 'string' },
        example: 'Hello, World!'
      }
    ],
    responses: {
      200: {
        description: 'Texto codificado com sucesso.',
        example: {
          error: false,
          type: 'encode',
          entry: {
            input: 'Hello, World!',
            output: '01001000011001010110110001101100011011110010110000100000010101110110111101110010011011000110010000100001'
          }
        }
      },
      400: {
        description: 'Parâmetro \'q\' ausente ou inválido.',
        example: {
          error: true,
          message: 'Query is required'
        }
      }
    }
  })
  encode(req: any, res: any) {
    const text = req.query.q;
    if (!text) {
      return res.status(400).json({
        error: true,
        message: 'Query is required'
      });
    }

    const binary = text.split('').map((c: string) =>
      c.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');

    res.json({
      error: false,
      type: 'encode',
      entry: {
        input: text,
        output: binary
      }
    });
  }

  @Get('/decode')
  @Swagger({
    summary: 'Decodifica binário para texto',
    description: 'Converte código binário de volta para texto',
    tags: ['code-binary'],
    parameters: [
      {
        name: 'q',
        in: 'query',
        description: 'O código binário a ser decodificado',
        required: true,
        schema: { type: 'string' },
        example: '0100100001100101011011000110110001101111'
      }
    ],
    responses: {
      200: {
        description: 'Binário decodificado com sucesso',
        example: {
          error: false,
          type: 'decode',
          entry: {
            input: '0100100001100101011011000110110001101111',
            output: 'Hello'
          }
        }
      },
      400: {
        description: 'Binário inválido',
        example: {
          error: true,
          message: 'Invalid binary'
        }
      }
    }
  })
  decode(req: any, res: any) {
    const binary = req.query.q;
    if (!binary) {
      return res.status(400).json({
        error: true,
        message: 'Query is required'
      });
    }

    try {
      const text = binary.match(/.{8}/g)?.map((byte: string) =>
        String.fromCharCode(parseInt(byte, 2))
      ).join('') || '';

      res.json({
        error: false,
        type: 'decode',
        entry: {
          input: binary,
          output: text
        }
      });
    } catch (e) {
      res.status(400).json({
        error: true,
        message: 'Invalid binary'
      });
    }
  }
}

@Controller('/users')
class UserController {
  @Get('/')
  @Swagger({
    summary: 'Lista todos os usuários',
    description: 'Retorna uma lista paginada de usuários',
    tags: ['Users'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        description: 'Número da página',
        schema: { type: 'number' },
        example: 1
      }
    ],
    responses: {
      200: {
        description: 'Lista de usuários',
        example: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' }
        ]
      }
    }
  })
  list(req: any, res: any) {
    res.json([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]);
  }

  @Get('/:id')
  @Swagger({
    summary: 'Busca usuário por ID',
    tags: ['Users'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'ID do usuário',
        required: true,
        schema: { type: 'string' },
        example: '123'
      }
    ],
    responses: {
      200: {
        description: 'Usuário encontrado',
        example: { id: '123', name: 'John Doe' }
      },
      404: {
        description: 'Usuário não encontrado'
      }
    }
  })
  getById(req: any, res: any) {
    res.json({
      id: req.params.id,
      name: 'John Doe',
      email: 'john@example.com'
    });
  }

  @Post('/')
  @Swagger({
    summary: 'Cria novo usuário',
    tags: ['Users'],
    requestBody: {
      description: 'Dados do usuário',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            },
            required: ['name', 'email']
          },
          example: {
            name: 'João Silva',
            email: 'joao@example.com'
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Usuário criado',
        example: { id: 123, name: 'João Silva', email: 'joao@example.com' }
      },
      400: {
        description: 'Dados inválidos'
      }
    }
  })
  create(req: any, res: any) {
    const newUser = { id: Date.now(), ...(req.body as any) };
    res.status(201).json(newUser);
  }
}

const app = new AzuraClient();

setupSwaggerWithControllers(app, {
  title: 'API Super Fácil',
  description: 'Documentação simplificada com @Swagger decorator!',
  version: '1.0.0',
  tags: [
    { name: 'code-binary', description: 'Operações de codificação binária' },
    { name: 'Users', description: 'Gerenciamento de usuários' }
  ],
  enabled: false
}, [BinaryController, UserController]);

app.listen(3000).then(() => {
  console.log('\n🚀 Server: http://localhost:3000');
  console.log('📚 Docs: http://localhost:3000/docs');
  console.log('\n💡 Agora é MUITO mais fácil com @Swagger! 😊\n');
});
