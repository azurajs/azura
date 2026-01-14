# Template para Depoimentos - AzuraJS

Obrigado por querer compartilhar sua experiência com AzuraJS! 🎉

## Como adicionar seu depoimento

1. Faça um fork do repositório
2. Edite o arquivo `depoiments/depoiments.json`
3. Adicione seu depoimento seguindo a estrutura abaixo
4. Abra um Pull Request

## Estrutura do Depoimento

```json
{
  "user": "seu-usuario-github",
  "name": "Seu Nome Completo",
  "role": "Seu Cargo ou Função",
  "description": "Seu depoimento sobre AzuraJS aqui. Conte o que você acha do framework, como ele te ajudou, etc.",
  "avatar": "https://github.com/seu-usuario-github.png"
}
```

## Campos

### Obrigatórios ✅

- **`user`**: Seu nome de usuário no GitHub
- **`description`**: Seu depoimento sobre o AzuraJS (máximo 280 caracteres recomendado)

### Opcionais 📝

- **`name`**: Seu nome completo (se não informar, será usado o `user`)
- **`role`**: Seu cargo, função ou título (ex: "Backend Developer", "Full Stack Engineer", "CTO")
- **`avatar`**: URL da foto de perfil (se não informar, será usado `https://github.com/{user}.png`)

## Exemplo Completo

```json
{
  "depoiments": [
    {
      "user": "johndoe",
      "name": "John Doe",
      "role": "Senior Backend Developer",
      "description": "AzuraJS transformou a forma como desenvolvo APIs. A simplicidade e performance são incríveis!",
      "avatar": "https://github.com/johndoe.png"
    }
  ]
}
```

## Exemplo Mínimo

```json
{
  "depoiments": [
    {
      "user": "janedoe",
      "description": "Framework incrível! Super recomendo para quem busca performance e simplicidade."
    }
  ]
}
```

## Dicas 💡

- **Seja autêntico**: Compartilhe sua experiência real com o framework
- **Seja conciso**: Depoimentos curtos e diretos são mais impactantes
- **Foque nos benefícios**: O que o AzuraJS trouxe para seus projetos?
- **Evite propaganda**: Foque na sua experiência técnica

## Precisa de ajuda?

Se tiver alguma dúvida, abra uma [issue](https://github.com/azurajs/azura/issues) ou entre em contato!

---

Obrigado por fazer parte da comunidade AzuraJS! 🚀
