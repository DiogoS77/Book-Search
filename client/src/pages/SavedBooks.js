import React, {useEffect} from "react";
import {Container, Card, Button, Row, Col} from "react-bootstrap";
import {useQuery, useMutation} from "@apollo/client";
import {QUERY_ME} from "../utils/queries";
import {REMOVE_BOOK} from "../utils/mutations";
import {removeBookId} from "../utils/localStorage";
import Auth from "../utils/auth";

const SavedBooks = () => {
  const {loading, data, refetch} = useQuery(QUERY_ME);
  const [removeBook] = useMutation(REMOVE_BOOK);
  const userData = data?.me || {};

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {}, [data]);

  const handleDeleteBook = async (bookId) => {
    const token = Auth.getToken();

    if (!token) {
      return false;
    }

    try {
      const {data} = await removeBook({variables: {bookId}});
      const updatedUserData = data?.me || {};

      removeBookId(bookId);

      refetch({...userData, savedBooks: updatedUserData.savedBooks});
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <>
      <div fluid className="text-light bg-dark p-5">
        <Container>
          <h1>Viewing saved books!</h1>
        </Container>
      </div>
      <Container>
        <h2 className="pt-5">
          {userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? "book" : "books"
              }:`
            : "You have no saved books!"}
        </h2>
        <Row>
          {userData.savedBooks.map((book) => (
            <Col md="4" key={book.bookId}>
              <Card border="dark">
                {book.image && (
                  <Card.Img
                    src={book.image}
                    alt={`The cover for ${book.title}`}
                    variant="top"
                  />
                )}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className="small">Authors: {book.authors}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button
                    className="btn-block btn-danger"
                    onClick={() => handleDeleteBook(book.bookId)}
                  >
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
