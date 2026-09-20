package pe.edu.utec.vetcare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.utec.vetcare.entity.AtencionEntity;

public interface AtencionRepository extends JpaRepository<AtencionEntity, Long> {

    boolean existsByCita_IdCita(Long idCita);
}